/* eslint-disable no-param-reassign */
import r from 'rethinkdb';
import ResourceArray from './ResourceArray';
import {
  isPushCompliant,
  isPutCompliant,
  isRemoveCompliant,
  isSpliceCompliant,
} from './constraints/update';

import {
  mergeRelationships,
  requiresIndex,
  retrieveManyRecords,
  retrieveSingleRecord,
  isDataValidForSpliceAndPush,
} from './utils';

import {
  pushInverse,
  pushOriginal,
  put,
  remove,
  spliceInverse,
  spliceOriginal,
} from './queries';

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
    this.meta = record._meta || {};

    this.attributes = {};

    // FIXME: ensure this clones deeply enough
    this.relationships = { ...schema.relationships };

    Object.keys(record).forEach(field => {
      // hydrate attributes
      if (schema.hasAttribute(field)) {
        this.attributes[field] = record[field];
        return;
      }

      // hydrate relationships
      if (schema.hasRelationship(field)) {
        const relationship = schema.relationship(field);
        const relation = relationship.relation;
        const inverseRelation = relationship.inverse.relation;

        this.relationships[field] = {
          ...relationship,
        };

        if (relation === 'hasMany') {
          if (inverseRelation === 'hasMany') this.relationships[field].records = record[field];
          else return;
        }

        this.relationships[field].record = record[field];
        return;
      }
    });
  }

  /**
   * Returns an attribute.
   *
   * ```javascript
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
   * ```javascript
   * app.model('user').fetchResource('1').then(user => {
   *   user.relationship('pets') === {
   *     type: 'animal',
   *     field: 'pets',
   *     schema: Schema,
   *     relation: 'hasMany',
   *     inverse: {
   *       type: 'user',
   *       relation: 'belongsTo',
   *       field: 'owner',
   *     },
   *   }
   *
   *   user.relationship('teachers') === {
   *     type: 'teacher',
   *     field: 'teachers',
   *     schema: Schema,
   *     relation: 'hasMany',
   *     records: [{
   *       id: '1',
   *       _archived: false,
   *       _related: true,
   *     }, {
   *       id: '2',
   *       _archived: false,
   *       _related: true,
   *     }],
   *     inverse: {
   *       type: 'user',
   *       relation: 'hasMany',
   *       field: 'students',
   *     },
   *   }
   *
   *   user.relationship('company') === {
   *     type: 'company',
   *     field: 'company',
   *     schema: Schema,
   *     relation: 'hasOne',
   *     record: {
   *       id: '2',
   *       _archived: false,
   *       _related: true,
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
    if (typeof relationship !== 'string') {
      throw new TypeError(
        'Tried calling \'relationship\' method with an argument that was not a String.'
      );
    }

    return this.relationships[relationship];
  }

  /**
   * Returns an updated version of the resource.
   *
   * @param {Options} [options={}]
   * @return {Promise<Resource>}
   */
  reload(options = {}) {
    const { schema, id, conn } = this;

    let table = r.table(schema.type);

    table = retrieveSingleRecord(table, id, options);

    return table
      .run(conn)
      .then(record => new Resource(conn, schema, record));
  }

  /**
   * Fetches either the `Resource` or `ResourceArray` related to this resource by `relationship`.
   *
   * ```javascript
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

    const { conn, id } = this;

    const {
      type,
      schema,
      relation,
      inverse,
      record: relatedRecord,
      records: relatedRecords,
    } = this.relationship(relationship);

    let table = r.table(type);

    if (relation === 'hasMany') {
      if (requiresIndex(relation, inverse.relation)) {
        table = table.getAll(id, { index: inverse.field });
      } else {
        table = table.getAll(r.args(relatedRecords.map(record => record.id)));
      }

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
   * Updates this resource's attributes.
   *
   * ```javascript
   * app.model('user').fetchResource('1').then(user => {
   *   return user.update({
   *     name: 'CJ',
   *   });
   * }).then(user => {
   *   // Resource
   * });
   * ```
   *
   * @param {Object} fields
   * @return {Promise<Resource>}
   */
  update(fields) {
    const { schema, id, conn, reload } = this;
    const { type } = schema;

    const table = r.table(type);

    Object.keys(fields).forEach(field => {
      if (!schema.hasAttribute(field)) delete fields.field;
    });

    return table
      .get(id)
      .update(fields)
      .run(conn)
      .then(reload.bind(this));
  }

  /**
   * Archives this resource and recursively archives it's corresponding relationships.
   *
   * @return {Promise<Resource>}
   */
  archive() {
  }

  /**
   * Assigns a resource to this resource's `hasOne` or `belongsTo` relationship identified
   * by `relationship`. The `data` argument can either be a Resource or String id.
   *
   * ```javascript
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
   *   const { user, company } = results;
   *   return user.put('company', company);
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
    const relationshipObject = this.relationship(relationship);
    const { relation, inverse, field } = relationshipObject;
    const { conn, schema, id, reload } = this;

    let idToPut;

    if (relation !== 'hasOne' && relation !== 'belongsTo') {
      throw new TypeError(
        `Tried calling 'put' on a resource whose 'relationship' is '${relation}'. This method ` +
        'only works for resources whose \'relationship\' is \'hasOne\' or \'belongsTo\'.'
      );
    }

    if (!(data instanceof Resource || typeof data === 'string')) {
      throw new TypeError(
        'Tried calling \'put\' with \'data\' that was neither a Resource nor a String.'
      );
    }

    const putData = (isCompliant) => {
      if (!isCompliant) {
        throw new Error(
          'Tried calling \'put\' with \'data\' that violated Redink\'s update constraints.'
        );
      }

      switch (inverse.relation) {
        case 'hasMany':
          return put(schema.type, id, field, idToPut)
            .run(conn);

        case 'hasOne':
          return r.do(
            put(schema.type, id, field, idToPut),
            put(inverse.type, idToPut, inverse.field, id)
          ).run(conn);

        default:
          throw new TypeError(
            'Tried calling \'put\' on a resource whose inverse \'relationship\' ' +
            `is '${inverse.relation}'.`
          );
      }
    };

    // Ensure `id` is an id string
    if (typeof data === 'string') idToPut = data;
    if (data instanceof Resource) idToPut = data.id;

    return isPutCompliant(relationshipObject, idToPut, conn)
      .then(putData)
      .then(reload.bind(this));
  }

  /**
   * Removes this resource's `hasOne` relationship. The `relationship` argument must be a
   * relationship String.
   *
   * ```javascript
   * app.model('user').fetchResource('1').then(user => {
   *   return user.remove('company');
   * }).then(user => {
   *   // Resource
   * });
   * ```
   *
   * @async
   * @param {String} relationship
   * @return {Promise<Resource>}
   */
  remove(relationship) {
    const relationshipObject = this.relationship(relationship);
    const { relation, inverse, record, field } = relationshipObject;
    const { relation: inverseRelation } = inverse;
    const { schema, id, conn, reload } = this;

    if (relation !== 'hasOne') {
      throw new TypeError(
        `Tried calling 'remove' on a resource whose 'relationship' is '${relation}'. This method ` +
        'only works for resources whose \'relationship\' is \'hasOne\'.'
      );
    }

    const removeData = () => {
      if (!isRemoveCompliant(inverseRelation)) {
        throw new Error(
          'Tried calling \'remove\' with a relationship that violated Redink\'s update constraints.'
        );
      }

      switch (inverseRelation) {
        case 'hasMany':
          return remove(schema.type, id, field, record.id)
            .run(conn);

        case 'hasOne':
          return r.do(
            remove(schema.type, id, field, record.id),
            remove(inverse.type, record.id, inverse.field, id)
          ).run(conn);

        default:
          throw new TypeError(
            'Tried calling \'remove\' on a resource whose inverse \'relationship\' ' +
            `is '${inverseRelation}'.`
          );
      }
    };

    return removeData()
      .then(reload.bind(this));
  }

  /**
   * Pushes data to this resource's `relationship`. The `data` can either be a `Resource`,
   * `ResourceArray`, array of Strings representing ids, or a String id.
   *
   * ```javascript
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
   *   const { user, pets } = results;
   *   return user.push('pets', pets);
   * }).then(user => {
   *   const newPets = user.relationship('pets'); // will include pets with name of 'Lassy'
   * });
   * ```
   *
   * @async
   * @param {String} relationship
   * @param {(String|String[]|Resource|ResourceArray)} data
   * @return {Promise<Resource>}
   */
  push(relationship, data) {
    const relationshipObject = this.relationship(relationship);
    const { relation, inverse, field, records } = relationshipObject;
    const { schema, id, conn, reload } = this;

    let idsToPush;

    if (relation !== 'hasMany') {
      throw new TypeError(
        `Tried calling 'push' on a resource whose 'relationship' is '${relation}'. This method ` +
        'only works for resources whose \'relationship\' is \'hasMany\'.'
      );
    }

    if (!isDataValidForSpliceAndPush(data)) {
      throw new TypeError(
        'Tried calling \'push\' with \'data\' that was neither a Resource, ResourceArray, ' +
        'Array of Strings, nor a String ID.'
      );
    }

    const pushData = (isCompliant) => {
      if (!isCompliant) {
        throw new Error(
          'Tried calling \'push\' with \'data\' that violated Redink\'s update constraints.'
        );
      }

      return r.do(
        pushOriginal(schema.type, id, field, records, idsToPush),
        pushInverse(inverse.type, inverse.field, records, idsToPush, id)
      ).run(conn);
    };

    // Ensure `ids` is an array of id strings
    if (Array.isArray(data)) idsToPush = data;
    if (data instanceof ResourceArray) idsToPush = data.map(resource => resource.id);
    if (typeof data === 'string') idsToPush = [data];

    return isPushCompliant(relationshipObject, idsToPush, conn)
      .then(pushData)
      .then(reload.bind(this));
  }

  /**
   * Splices data from the resource's `relationship`. The `data` can either be a `Resource`,
   * `ResourceArray`, array of Strings representing ids, or a String id.
   *
   * ```javascript
   * app.model('user').fetchResource('1').then(user => {
   *   return user.splice('pets', ['1', '2']);
   * }).then(user => {
   *   const newPets = user.relationship('pets'); // will not include pets with ids '1' and '2'
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
   *   const { user, pets } = results;
   *   return user.push('pets', pets);
   * }).then(user => {
   *   const newPets = user.relationship('pets'); // will not include any pets with the name 'Lassy'
   * });
   * ```
   *
   * @async
   * @param {String} relationship
   * @param {(String|String[]|Resource|ResourceArray)} data
   * @return {Promise<Resource>}
   */
  splice(relationship, data) {
    const relationshipObject = this.relationship(relationship);
    const { relation, inverse, field } = relationshipObject;
    const { relation: inverseRelation } = inverse;
    const { schema, id, conn, reload } = this;

    let idsToSplice;

    if (relation !== 'hasMany') {
      throw new TypeError(
        `Tried calling 'splice' on a resource whose 'relationship' is '${relation}'. This method ` +
        'only works for resources whose \'relationship\' is \'hasMany\'.'
      );
    }

    if (!isDataValidForSpliceAndPush(data)) {
      throw new TypeError(
        'Tried calling \'splice\' with \'data\' that was neither a Resource, ResourceArray, ' +
        'Array of Strings, nor a String ID.'
      );
    }

    const spliceData = () => {
      if (!isSpliceCompliant(inverseRelation)) {
        throw new Error(
          'Tried calling \'splice\' with a relationship that violated Redink\'s update constraints.'
        );
      }

      // Ensure `ids` is an array of id strings
      if (Array.isArray(data)) idsToSplice = data;
      if (data instanceof ResourceArray) idsToSplice = data.map(resource => resource.id);
      if (typeof data === 'string') idsToSplice = [data];

      return r.do(
        spliceOriginal(schema.type, field, id, idsToSplice),
        spliceInverse(inverse.type, inverse.field, idsToSplice, id)
      ).run(conn);
    };

    return spliceData()
      .then(reload.bind(this));
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
      _meta: {
        ...this.meta,
      },
    };
  }
}
