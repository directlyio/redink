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

      return table.run(conn)
        .then(records => new ResourceArray(conn, schema, records));
    }

    table = retrieveSingleRecord(table, relatedRecord.id, options);
    table = mergeRelationships(table, schema, options);

    return table.run(conn)
      .then(record => new Resource(conn, schema, record));
  }

  update(updates) {
  }

  archive() {
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
