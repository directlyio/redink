import r from 'rethinkdb';
import Resource from './Resource';
import ResourceArray from './ResourceArray';

import {
  mergeRelationships,
  retrieveManyRecords,
  retrieveSingleRecord,
} from './utils';

export default class Model {
  /**
   * Instantiates a Model.
   *
   * @class Model
   * @param {Object} conn - RethinkDB connection object.
   * @param {String} type
   * @param {Schema} schema
   */
  constructor(conn, type, schema) {
    if (!conn) {
      throw new TypeError('A valid RethinkDB connection is required to instantiate a Resource.');
    }

    if (!type) {
      throw new TypeError('A valid type is required to instantiate a model.');
    }

    if (!schema) {
      throw new TypeError('A valid schema is required to instantiate a model.');
    }

    this.conn = conn;
    this.type = type;
    this.schema = schema;
  }

  /**
   * Finds resources that match the criteria in `options`.
   *
   * ```
   * app.model('user').find({
   *   filter: { name: 'Dylan' },
   *   pluck: { password: true },
   *   include: {
   *     pets: {
   *       filter: (pet) => pet('age').gt(6),
   *       pluck: {
   *         favoriteTreat: true,
   *         color: true,
   *       },
   *     },
   *     company: true,
   *   },
   * }).then(users => {
   *   // ResourceArray
   * });
   * ```
   *
   * @async
   * @method find
   * @param {Object} [options={}]
   * @return {Promise<ResourceArray>}
   *
   * @todo Write more docs on `options`
   */
  find(options = {}) {
    const { conn, schema } = this;
    const { type } = schema;

    let table = r.table(type);

    table = retrieveManyRecords(table, options);
    table = mergeRelationships(table, schema, options);
    table = table.coerceTo('array');

    return table.run(conn)
      .then(records => new ResourceArray(conn, schema, records));
  }

  /**
   * Finds the first resource (out of potentially many) that matches the criteria in `options.`
   *
   * @async
   * @param {Object} [options={}]
   * @return {Promise<Resource>}
   */
  findOne(options = {}) {
    return this.find(options).then(resources => resources.first());
  }

  /**
   * Retrieves the resource(s) related to a particular resource identified by `id` according to
   * `relationship`. A relationship with a relation of `hasMany` returns a `ResourceArray`, and a
   * relationship with a relation of `hasOne` or `belongsTo` returns a `Resource`.
   *
   * ```js
   * // pretend user `1` has a ton of pets
   * app.model('user').findRelated('1', 'pets', {
   *   filter: { species: 'hamster' },
   * }).then(pets => {
   *   // ResourceArray
   * });
   *
   * // pretend user `1` has a company
   * app.model('user').findRelated('1', 'company').then(company => {
   *   // Resource
   * });
   * ```
   *
   * @async
   * @param {String} id - The id of the parent resource.
   * @param {String} relationship - The relationship to the parent.
   * @param {Object} [options={}]
   * @returns {Promise<Resource|ResourceArray>}
   */
  findRelated(id, relationship, options = {}) {
    const { conn, schema, schema: { type: parentType } } = this;
    const { type: relatedType, relation } = schema.relationships[relationship];

    let relatedTable = r.table(relatedType);
    const parentTable = r.table(parentType);
    const ids = parentTable.get(id)(relationship)('id');

    if (relation === 'hasMany') {
      relatedTable = relatedTable.getAll(r.args(ids));
      relatedTable = retrieveManyRecords(relatedTable, options);
      relatedTable = mergeRelationships(relatedTable, schema, options);
      relatedTable = relatedTable.coerceTo('array');

      return relatedTable.run(conn)
        .then(records => new ResourceArray(conn, schema, records));
    }

    relatedTable = retrieveSingleRecord(relatedTable, id, options);
    relatedTable = mergeRelationships(relatedTable, schema, options);

    return relatedTable.run(conn)
      .then(record => new Resource(conn, schema, record));
  }

  /**
   * Retrieves the resource corresponding to `id`.
   *
   * ```js
   * app.model('user').fetchResource('1').then(user => {
   *   // Resource
   * });
   * ```
   *
   * @async
   * @param {String} id - The ID of the resource to retrieve.
   * @param {Object} [options={}]
   * @returns {Promise<Resource>}
   */
  fetchResource(id, options = {}) {
    const { conn, schema } = this;
    let table = r.table(schema.type);

    table = retrieveSingleRecord(table, id, options);
    table = mergeRelationships(table, schema, options);

    return table.run(conn)
      .then(record => new Resource(conn, schema, record));
  }

  /**
   * Persists a record in the database and creates a resource. The 'record' object must be a
   * flattenen JSON with attributes and relationships. All relationships in `record` must be
   * represented by either a string for a `hasOne` or `belongsTo` relation, or an array of strings
   * for a `hasMany` relation.
   *
   * ```js
   * app.model('user').create({
   *   name: 'Dylan',
   *   email: 'dylanslack@gmail.com',
   *   password: 'supersecret',
   *   pets: [ '1', '2', '3' ],
   *   company: '1',
   * }).then(user => {
   *   // Resource
   * });
   * ```
   *
   * @async
   * @param {Object} record
   * @param {Object} [options={}]
   * @returns {Promise<Resource>}
   */
  create(record, options = {}) {
    const { conn, schema } = this;
    const { type } = schema;

    let createdRecordId;
    let createdResource;

    return r.table(type).insert(record).run(conn)

      // retrieve the record that was just created
      .then(({ generated_keys: keys }) => {
        createdRecordId = keys[0];
        return retrieveSingleRecord(type, createdRecordId, options).run(conn);
      })

      // create the resource and sync its relationships
      .then(createdRecord => {
        createdResource = new Resource(conn, schema, createdRecord);
        return createdResource.syncRelationships();
      })

      // return the resource
      .then(() => createdResource);
  }
}
