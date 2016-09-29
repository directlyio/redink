import r from 'rethinkdb';
import { retrieveManyRecords, retrieveSingleRecord } from './utils';
import { createResource } from './Resource';
import { createResourceArray } from './ResourceArray';

export default class Model {
  /**
   * Instantiates a Model.
   *
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
   *   include: { pets: true },
   * }).then(users => {
   *   // ResourceArray
   * });
   * ```
   *
   * @param {Object} [options={}]
   * @return {ResourceArray}
   */
  find(options = {}) {
    const { conn, schema } = this;
    const { type } = schema;

    const table = r.table(type);

    return retrieveManyRecords(table, options)
      .run(conn)
      .then(records => createResourceArray(conn, schema, records));
  }

  /**
   * Finds the first resource (out of potentially many) that matches the criteria in `options.`
   *
   * @param {Object} [options={}]
   * @return {Resource}
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
   * @returns {Resource|ResourceArray}
   */
  findRelated(id, relationship, options = {}) {
    const { conn, schema, schema: { type: parentType } } = this;
    const { type: relatedType, relation } = schema.relationships[relationship];

    let relatedTable = r.table(relatedType);
    const parentTable = r.table(parentType);
    const ids = parentTable.get(id)(relationship)('id');

    if (relation === 'hasMany') {
      relatedTable = relatedTable.getAll(r.args(ids));

      return retrieveManyRecords(relatedTable, options)
        .run(conn)
        .then(records => createResourceArray(conn, schema, records));
    }

    return retrieveSingleRecord(relatedTable, id, options)
      .run(conn)
      .then(record => createResource(conn, schema, record));
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
   * @returns {Resource}
   */
  fetchResource(id, options = {}) {
    const { conn, schema } = this;
    const table = r.table(schema.type);

    return retrieveSingleRecord(table, id, options)
      .run(conn)
      .then(record => createResource(conn, schema, record));
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
   * @returns {Resource}
   */
  create(record, options = {}) {
    const { conn, schema } = this;
    const { type } = schema;

    let createdRecordId;
    let createdResource;

    return r.table(type)
      .insert(record)
      .run(conn)

      // retrieve the record that was just created
      .then(({ generated_keys: keys }) => {
        createdRecordId = keys[0];
        return retrieveSingleRecord(type, createdRecordId, options).run(conn);
      })

      // create the resource and sync its relationships
      .then(createdRecord => {
        createdResource = createResource(conn, schema, createdRecord);
        return createdResource.syncRelationships();
      })

      // return the resource
      .then(() => createdResource);
  }

  /**
   * Updates a record in the database and creates a resource. The data object must be a flattened
   * JSON with attributes and relationships, which are represented by ids. Missing attributes and
   * relationships are not interpreted as null.
   *
   * ```js
   * app.model('user').update('1', {
   *   name: 'Bob Smith',
   * }).then(user => {
   *   // Resource
   * });
   * ```
   *
   * @async
   * @param {String} id
   * @param {Object} updates
   * @param {Object} [options={}]
   * @returns {Resource}
   */
  update(id, updates, options = {}) {
    const { conn, schema } = this;
    const { type } = schema;

    let updatedResource;

    return r.table(type).get(id)
      .update(updates)
      .run(conn)

      // retrieve the record that was just created
      .then(() => retrieveSingleRecord(type, id, options))

      // create the resource
      .then(record => {
        updatedResource = createResource(schema, record);
        return updatedResource;
      })

      // sync the resource's relationships
      .then(() => updatedResource.syncRelationships())

      // return the resource
      .then(() => updatedResource);
  }

  /**
   * Archives a record.
   *
   * ```js
   * app.model('user').archive('1').then(user => {
   *   user.isArchived() === true
   * });
   * ```
   *
   * @async
   * @param {String} id
   * @param {Object} [options={}]
   * @returns {Resource}
   */
  archive(id, options = {}) {
    const { conn, schema } = this;
    const { type } = this.schema;

    let archivedResource;

    return r.table(type).get(id)
      .update({ meta: { _archived: true } })
      .run(conn)

      // retrieve the record that was just archived
      .then(() => retrieveSingleRecord(type, id, options))

      // create the resource
      .then(record => {
        archivedResource = createResource(schema, record);
        return archivedResource;
      })

      // sync the resource's relationships
      .then(() => archivedResource.syncRelationships())

      // return the resource
      .then(() => archivedResource);
  }
}

export const createModel = (...args) => new Model(...args);
