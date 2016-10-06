import r from 'rethinkdb';
import ResourceArray from './ResourceArray';

import {
  mergeRelationships,
  retrieveManyRecords,
  retrieveSingleRecord,
} from './utils';

export default class Resource {
  /**
   * Instantiates a Resource.
   *
   * @class Resource
   * @param {Object} conn - RethinkDB connection object.
   * @param {Schema} schema
   * @param {Object} record
   */
  constructor(conn, schema, record) {
    if (!conn) {
      throw new TypeError('A valid RethinkDB connection is required to instantiate a Resource.');
    }

    if (!schema) {
      throw new TypeError('A valid schema is required to instantiate a Resource.');
    }

    if (!record) {
      throw new TypeError('A valid record is required to instantiate a Resource.');
    }

    this.conn = conn;
    this.schema = schema;
    this.id = record.id;
    this.meta = record.meta || {};

    this.attributes = {};
    this.relationships = {};

    Object.keys(record).forEach(field => {
      // hydrate attributes
      if (schema.hasAttribute(field)) {
        this.attributes[field] = record[field];
        return;
      }

      // hydrate relationships
      if (schema.hasRelationship(field)) {
        const relationship = schema.relationship(field);
        const recordsOrRecord = relationship.relation === 'hasMany'
          ? 'records'
          : 'record';

        this.relationships[field] = {
          ...relationship,
          [recordsOrRecord]: record[field],
        };

        return;
      }
    });
  }

  /**
   * Returns an attribute.
   *
   * ```
   * app.model('user').fetchResource('1').then(user => {
   *   user.attribute('name') === 'Dylan'
   * });
   * ```
   *
   * @method attribute
   * @param {String} attribute
   * @return {Any}
   */
  attribute(attribute) {
    return this.attributes[attribute];
  }

  /**
   * Returns a relationship of the resource.
   *
   * ```
   * app.model('user').fetchResource('1').then(user => {
   *   user.relationship('pets') === {
   *     type: 'animal',
   *     schema: Schema,
   *     relation: 'hasMany',
   *     records: [{
   *       id: '1',
   *       _archived: false,
   *     }, {
   *       id: '2',
   *       _archived: false,
   *     }],
   *     inverse: {
   *       type: 'user',
   *       relation: 'belongsTo',
   *       field: 'owner',
   *     },
   *   }
   *
   *   user.relationship('company') === {
   *     type: 'company',
   *     schema: Schema,
   *     relation: 'hasOne',
   *     record: {
   *       id: '1',
   *       _archived: false,
   *     },
   *     inverse: {
   *       type: 'user',
   *       relation: 'hasMany',
   *       field: 'employees',
   *     },
   *   }
   * });
   * ```
   *
   * @method relationship
   * @param {String} relationship
   * @return {Object}
   */
  relationship(relationship) {
    return this.relationships[relationship];
  }

  /**
   * Ensures that the state of this resource propagates through its relationships that demand
   * propagation.
   *
   * @private
   * @return {Promise}
   */
  syncRelationships() {
  }

  /**
   * Fetches either the `Resource` or `ResourceArray` related to this resource by `relationship`.
   *
   * ```
   * app.model('user').fetchResource('1').then(user => {
   *   return user.fetch('company');
   * }).then(company => {
   *   // Resource
   * });
   * ```
   *
   * @method fetch
   * @param {String} relationship
   * @param {Options} [options={}]
   * @return {Promise<Resource|ResourceArray>}
   */
  fetch(relationship, options = {}) {
    if (!this.relationship(relationship)) {
      return Promise.resolve(null);
    }

    const { conn } = this;

    const {
      type,
      schema,
      relation,
      record: relatedRecord,
      records: relatedRecords,
    } = this.relationship(relationship);

    let table = r.table(type);

    if (relation === 'hasMany') {
      table = table.getAll(r.args(relatedRecords.map(record => record.id)));
      table = retrieveManyRecords(table, options);
      table = mergeRelationships(table, schema, options);
      table = table.coerceTo('array');

      return table.run(conn)
        .then(records => new ResourceArray(conn, schema, records));
    }

    table = retrieveSingleRecord(table, relatedRecord.id, options);
    table = mergeRelationships(table, schema, options);

    return table.run(conn)
      .then(record => new Resource(conn, schema, record));
  }

  /**
   * Updates this resoure's attributes based on `attributes`.
   *
   * @param {Object} updates
   * @return {Promise<Resource>}
   */
  update(updates) {
  }

  archive() {
  }

  /**
   * Reloads this resource with the latest data.
   *
   * @return {Promise<Resource>}
   */
  reload() {
  }

  /**
   * @async
   * @param {String} relationship
   * @param {(String[]|ResourceArray)} oldIds
   * @param {(String[]|ResourceArray)} newIds
   * @return {Promise<Resource>}
   */
  reconcile(relationship, oldIds, newIds) {
  }

  /**
   * Assigns a resource to this resource's `hasOne` relationship identified by `relationship`. The
   * `data` argument can either be a Resource or String id.
   *
   * ```
   * app.model('user').fetchResource('1').then(user => {
   *   return user.put('company', '1');
   * }).then(user => {
   *   // Resource
   * });
   *
   * app.model('user', 'company').map({
   *   user(model) {
   *     return model.fetchResource('1');
   *   },
   *   company(model) {
   *     return model.fetchResource('1');
   *   },
   * }).then(results => {
   *   return results.user.put('company', results.company);
   * }).then(user => {
   *   // Resource
   * });
   * ```
   *
   * @async
   * @param {String} relationship
   * @param {(String|Resource)} data
   * @return {Promise<Resource>}
   */
  put(relationship, data) {
  }

  /**
   * Removes this resource's `hasOne` relationship. The `data` argument can either be a `Resource`
   * or String id of the resource to remove.
   *
   * ```
   * app.model('user').fetchResource('1').then(user => {
   *   return user.remove('company');
   * }).then(user => {
   *   // Resource
   * });
   *
   * app.model('user', 'company').map({
   *   user(model) {
   *     return model.fetchResource('1');
   *   },
   *   company(model) {
   *     return model.fetchResource('1');
   *   },
   * }).then(results => {
   *   return results.user.remove('company', results.company);
   * }).then(user => {
   *   // Resource
   * });
   * ```
   *
   * @async
   * @param {String} relationship
   * @param {(String|Resource)} data
   * @return {Promise<Resource>}
   */
  remove(relationship, data) {
  }

  /**
   * Pushes data to this resource's `relationship`. The `data` can either be a `ResourceArray` or
   * an array of Strings representing ids.
   *
   * ```
   * app.model('user').fetchResource('1').then(user => {
   *   return user.push('pets', ['1', '2']);
   * }).then(user => {
   *   const newPets = user.relationship('pets'); // will include pets with ids '1' and '2'
   * });
   *
   * app.model('user', 'animal:pets').map({
   *   user(model) {
   *     return model.fetchResource('1');
   *   },
   *   pets(model) {
   *     return model.find({ filter: { name: 'Lassy' } }),
   *   },
   * }).then(results => {
   *   return results.user.push('pets', results.pets);
   * }).then(user => {
   *   const newPets = user.relationship('pets'); // will include pets with ids '1' and '2'
   * });
   * ```
   *
   * @async
   * @param {String} relationship
   * @param {(String[]|ResourceArray)} ids
   * @return {Promise<Resource>}
   */
  push(relationship, data) {
  }

  /**
   * Pushes data to this resource's `relationship`. The `data` can either be a `Resource` or
   * a String id.
   *
   * ```
   * app.model('user').fetchResource('1').then(user => {
   *   return user.put('company', '1');
   * }).then(user => {
   *   const newCompany = user.relationship('company'); // will be a company with id of '1'
   * });
   *
   * app.model('user', 'animal:pets').map({
   *   user(model) {
   *     return model.fetchResource('1');
   *   },
   *   pets(model) {
   *     return model.find({ filter: { name: 'Lassy' } }),
   *   },
   * }).then(results => {
   *   return results.user.push('pets', results.pets);
   * }).then(user => {
   *   const newPets = user.relationship('pets'); // will include pets with ids '1' and '2'
   * });
   * ```
   *
   * @async
   * @param {String} relationship
   * @param {(String[]|ResourceArray)} ids
   * @return {Promise<Resource>}
   */
  pop(relationship, data) {
    const { relation } = this.relationship(relationship);

    if (relation !== 'hasMany') {
      throw new TypeError(
        `Tried calling 'pop' on a relationship whose relation is '${relation}'. This method only ` +
        'works for relationships whose relation is \'hasMany\'.'
      );
    }
  }

  /**
   * Returns true if this is archived.
   *
   * @method isArchived
   * @return {Boolean}
   */
  isArchived() {
    // eslint-disable-next-line
    return this.meta._archived;
  }

  /**
   * Returns a plain object with an `attributes` key, a `relationships` key, and a `meta` key.
   *
   * @method toObject
   * @return {Object}
   */
  toObject() {
    return {
      id: this.id,
      attributes: {
        ...this.attributes,
      },
      relationships: {
        ...this.relationships,
      },
      meta: {
        ...this.meta,
      },
    };
  }
}
