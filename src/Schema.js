import {
  BELONGS_TO,
  HAS_ONE,
  HAS_MANY,
} from './constants/relationshipTypes';

const relationshipObject = (type, field, inverse, options) => ({
  type,
  field,
  inverse: {
    type: null,
    relation: null,
    field: inverse,
  },
  ...options,
});

class Schema {
  /**
   * Instantiates a Schema.
   *
   * The `type` argument is the name of the RethinkDB table.
   *
   * @param {String} type
   * @param {Object} [schema={}]
   */
  constructor(type, schema = {}) {
    if (!type) {
      throw new TypeError('A valid type is required to instantiate a schema.');
    }

    this.type = type;
    this.attributes = schema.attributes || {};
    this._meta = schema._meta || {};
    this.relationships = schema.relationships || {};
  }

  hasAttribute(attribute) {
    return this.attributes.hasOwnProperty(attribute);
  }

  hasRelationship(relationship) {
    return this.relationships.hasOwnProperty(relationship);
  }

  relationship(relationship) {
    return this.relationships[relationship] || {};
  }

  mapRelationships(fn) {
    return this.relationships.map(fn);
  }
}

export default (...args) => new Schema(...args);

export const hasMany = (type, inverse = '', options = {}) => (field) => ({
  ...relationshipObject(type, field, inverse, options),
  relation: HAS_MANY,
});

export const belongsTo = (type, inverse = '', options = {}) => (field) => ({
  ...relationshipObject(type, field, inverse, options),
  relation: BELONGS_TO,
});

export const hasOne = (type, inverse = '', options = {}) => (field) => ({
  ...relationshipObject(type, field, inverse, options),
  relation: HAS_ONE,
});
