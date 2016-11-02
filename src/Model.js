import r from 'rethinkdb';
import Resource from './Resource';
import ResourceArray from './ResourceArray';
import isCreateCompliant from './constraints/create';

import {
  applyOptions,
  mergeRelationships,
  normalizeRecord,
  requiresIndex,
  syncRelationships,
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
   * Finds resources that match the criteria in `pre` and `post` options.
   *
   * ```
   * model('user').find({
   *   filter: { name: 'Dylan' },
   *   without: { password: true },
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
   * @param {Object} [pre={}] - Critera before merging relationships.
   * @param {Object} [post={}] - Critera after merging relationships.
   * @return {Promise<ResourceArray>}
   *
   * @todo Write more docs on `options`
   */
  find(pre = {}, post = {}) {
    const { conn, schema } = this;
    const { type } = schema;

    let table = r.table(type);

    table = applyOptions(table, pre);
    table = mergeRelationships(table, schema, pre);
    table = applyOptions(table, post);
    table = table.coerceTo('array');

    return table.run(conn)
      .then(records => new ResourceArray(conn, schema, records));
  }

  /**
   * Finds the first resource (out of potentially many) that matches the criteria in `options.`
   *
   * @async
   * @method findOne
   * @param {Object} [pre={}] - Critera before merging relationships.
   * @param {Object} [post={}] - Critera after merging relationships.
   * @return {Promise<Resource>}
   */
  findOne(pre = {}, post = {}) {
    return this.find(pre, post).then(resources => resources.first());
  }

  /**
   * Returns the total count of resources.
   * @return {Number}
   */
  count() {
    const { conn, schema } = this;
    const { type } = schema;

    return r.table(type).count().run(conn);
  }

  /**
   * Finds resources using the index named `index`.
   *
   * ```
   * model('user').findByIndex('email', 'dylanslack@gmail.com').then(users => {
   *   // ResourceArray
   * });
   * ```
   *
   * @async
   * @method findByIndex
   * @param {String} index - The index name.
   * @param {*} value
   * @param {Object} [pre={}] - Critera before merging relationships.
   * @param {Object} [post={}] - Critera after merging relationships.
   * @return {Promise<ResourceArray>}
   *
   * @todo Add test.
   */
  findByIndex(index, value, pre = {}, post = {}) {
    const { conn, schema } = this;
    const { type } = schema;

    let table = r.table(type);

    table = table.getAll(value, { index });
    table = applyOptions(table, pre);
    table = mergeRelationships(table, schema, pre);
    table = applyOptions(table, post);
    table = table.coerceTo('array');

    return table.run(conn)
      .then(records => new ResourceArray(conn, schema, records));
  }

  /**
   * Finds a single resource from `index` that matches `value` and that matches the criteria in
   * `options`.
   *
   * @async
   * @method findOneByIndex
   * @param {String} index - The index name.
   * @param {*} value
   * @param {Object} [pre={}] - Critera before merging relationships.
   * @param {Object} [post={}] - Critera after merging relationships.
   * @return {Promise<Resource>}
   */
  findOneByIndex(index, value, pre = {}, post = {}) {
    return this.findByIndex(index, value, pre, post).then(resources => resources.first());
  }

  /**
   * Retrieves the resource(s) related to a particular resource identified by `id` according to
   * `relationship`. A relationship with a relation of `hasMany` returns a `ResourceArray`, and a
   * relationship with a relation of `hasOne` or `belongsTo` returns a `Resource`.
   *
   * ```js
   * // pretend user `1` has a ton of pets
   * model('user').findRelated('1', 'pets', {
   *   filter: { species: 'hamster' },
   * }).then(pets => {
   *   // ResourceArray
   * });
   *
   * // pretend user `1` has a company
   * model('user').findRelated('1', 'company').then(company => {
   *   // Resource
   * });
   * ```
   *
   * @async
   * @method findRelated
   * @param {String} id - The id of the parent resource.
   * @param {String} relationship - The relationship to the parent.
   * @param {Object} [pre={}] - Critera before merging relationships.
   * @param {Object} [post={}] - Critera after merging relationships.
   * @returns {Promise<Resource|ResourceArray>}
   */
  findRelated(id, relationship, pre = {}, post = {}) {
    const { conn, schema, schema: { type: parentType } } = this;

    const {
      type: relatedType,
      schema: relatedSchema,
      relation,
      inverse,
    } = schema.relationships[relationship];

    let table = r.table(relatedType);

    if (relation === 'hasMany') {
      if (requiresIndex(relation, inverse.relation)) {
        table = table.getAll(id, { index: inverse.field });
      } else {
        table = table.getAll(
          r.args(r.table(parentType).get(id)(relationship)('id'))
        );
      }

      table = table.coerceTo('array');
    } else {
      table = table.get(
        r.table(parentType).get(id)(relationship)('id')
      );
    }

    table = applyOptions(table, pre);
    table = mergeRelationships(table, relatedSchema, pre);
    table = applyOptions(table, post);

    return table.run(conn)
      .then(recordOrRecords => {
        if (relation === 'hasMany') return new ResourceArray(conn, relatedSchema, recordOrRecords);
        return new Resource(conn, relatedSchema, recordOrRecords);
      });
  }

  /**
   * Retrieves the resource corresponding to `id`.
   *
   * ```js
   * model('user').fetchResource('1').then(user => {
   *   // Resource
   * });
   * ```
   *
   * @async
   * @method fetchResource
   * @param {String} id - The ID of the resource to retrieve.
   * @param {Object} [pre={}] - Critera before merging relationships.
   * @param {Object} [post={}] - Critera after merging relationships.
   * @returns {Promise<Resource>}
   */
  fetchResource(id, pre = {}, post = {}) {
    const { conn, schema } = this;
    let table = r.table(schema.type);

    table = table.get(id);
    table = applyOptions(table, pre);
    table = mergeRelationships(table, schema, pre);
    table = applyOptions(table, post);

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
   * model('user').create({
   *   name: 'Dylan',
   *   email: 'dylanslack@gmail.com',
   *   password: 'hashedpassword',
   *   pets: [ '1', '2', '3' ],
   *   company: '1',
   * }).then(user => {
   *   // Resource
   * });
   * ```
   *
   * @async
   * @method create
   * @param {Object} record
   * @param {Object} [pre={}] - Critera before merging relationships.
   * @param {Object} [post={}] - Critera after merging relationships.
   * @returns {Promise<Resource>}
   */
  create(record, pre = {}, post = {}) {
    const { conn, schema } = this;
    const { type } = schema;

    const checkComplianceAndNormalizeRecord = (compliant) => {
      if (!compliant) {
        throw new Error(
          'Tried to create a record, but \'record\' had some invalid relationships.'
        );
      }

      return normalizeRecord(record, schema);
    };

    const createRecord = (normalizedRecord) => {
      let createdRecordId;
      let createdResource;

      return r.table(type).insert(normalizedRecord).run(conn)

        // retrieve the record that was just created
        .then(({ generated_keys: keys }) => {
          let table = r.table(type);
          createdRecordId = keys[0];

          table = table.get(createdRecordId);
          table = applyOptions(table, pre);
          table = mergeRelationships(table, schema, pre);
          table = applyOptions(table, post);

          return table.run(conn);
        })

        // create the resource and sync its relationships
        .then(createdRecord => {
          createdResource = new Resource(conn, schema, createdRecord);
          const syncRelationshipsArray = syncRelationships(record, schema, createdRecordId);

          return r.do(syncRelationshipsArray).run(conn);
        })

        // return the resource
        .then(() => createdResource);
    };

    // check record and it's relationships for Redink constraints
    return isCreateCompliant(record, schema, conn)
      .then(checkComplianceAndNormalizeRecord)
      .then(createRecord);
  }
}
