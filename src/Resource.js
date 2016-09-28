class Resource {
  /**
   * Instantiates a Resource.
   *
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
    this.id = record.id;
    this.meta = record.meta || {};

    this.attributes = {};
    this.relationships = {};

    Object.keys(record).forEach(field => {
      if (schema.hasAttribute(field)) {
        this.attributes[field] = record[field];
        return;
      }

      if (schema.hasRelationship(field)) {
        const relationship = schema.relationship(field);

        if (relationship.relation === 'hasMany') {
          this.relationships[field] = {
            ...relationship,
            records: record[field],
          };
        } else {
          this.relationships[field] = {
            ...relationship,
            record: record[field],
          };
        }

        return;
      }
    });
  }

  /**
   * Returns an attribute of the resource.
   *
   * ```
   * app.model('user').fetchResource('1').then(user => {
   *   user.attribute('name') === 'Dylan'
   * });
   * ```
   *
   * @param {String} attribute
   * @return {Any}
   */
  attribute(attribute) {
    return this.attributes[attribute] || '';
  }

  /**
   * Returns a relationship of the resource.
   *
   * ```
   * app.model('user').fetchResource('1').then(user => {
   *   user.relationship('pets') === {
   *     type: 'animal',
   *     records: [{
   *       id: '1',
   *       archived: false,
   *     }, {
   *       id: '2',
   *       archived: false,
   *     }],
   *     relation: 'hasMany',
   *     inverse: {
   *       type: 'user',
   *       relation: 'belongsTo',
   *       field: 'owner',
   *     },
   *   }
   *
   *   user.relationship('company') === {
   *     type: 'company',
   *     record: {
   *       id: '1',
   *       archived: false,
   *     },
   *     relation: 'hasOne',
   *     inverse: {
   *       type: 'user',
   *       relation: 'hasMany',
   *       field: 'employees',
   *     },
   *   }
   * });
   * ```
   *
   * @param {String} relationship
   * @return {Object}
   */
  relationship(relationship) {
    return this.relationships[relationship] || '';
  }

  fetch(relationship, options = {}) {
  }

  update(record) {
  }

  archive() {
  }

  isArchived() {
    return this.meta.archived;
  }

  toObject() {
    return {
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

export const createResource = (...args) => new Resource(...args);

export default Resource;
