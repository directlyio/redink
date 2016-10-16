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
  applyOptions,
  getArchiveOriginalUpdateObject,
  isDataValidForSpliceAndPush,
  mergeRelationships,
  requiresIndex,
} from './utils';

import {
  pushIdToInverseField,
  pushIdToOriginalField,
  putIdToRecordField,
  removeIdFromRecordField,
  spliceIdFromInverseField,
  spliceIdFromOriginalField,
  archiveRemoveIdFromRecordField,
  archiveRemoveIdFromManyRecordsField,
  archiveSpliceIdFromInverseField,
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
        const relationship = this.relationships[field];
        const recordOrRecords = relationship.relation === 'hasMany'
          ? 'records'
          : 'record';

        this.relationships[field] = {
          ...relationship,
          [recordOrRecords]: record[field],
        };
      }
    });
  }

  /**
   * Returns an attribute.
   *
   * ```javascript
   * model('user').fetchResource('1').then(user => {
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
   * model('user').fetchResource('1').then(user => {
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
   * @async
   * @method reload
   * @param {Options} [options={}]
   * @return {Promise<Resource>}
   */
  reload(options = {}) {
    const { schema, id, conn } = this;

    let table = r.table(schema.type);

    table = table.get(id);
    table = applyOptions(table, options);
    table = mergeRelationships(table, schema, options);

    return table.run(conn)
      .then(record => new Resource(conn, schema, record));
  }

  /**
   * Fetches either the `Resource` or `ResourceArray` related to this resource by `relationship`.
   *
   * ```javascript
   * model('user').fetchResource('1').then(user => {
   *   return user.fetch('company');
   * }).then(company => {
   *   // Resource
   * });
   * ```
   *
   * @async
   * @method fetch
   * @param {String} relationship
   * @param {Object} [options={}]
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

      table = table.coerceTo('array');
    } else {
      table = table.get(relatedRecord.id);
    }

    table = applyOptions(table, options);
    table = mergeRelationships(table, schema, options);

    return table.run(conn)
      .then(recordOrRecords => {
        if (relation === 'hasMany') return new ResourceArray(conn, schema, recordOrRecords);
        return new Resource(conn, schema, recordOrRecords);
      });
  }

  /**
   * Updates this resource's attributes.
   *
   * ```javascript
   * model('user').fetchResource('1').then(user => {
   *   return user.update({
   *     name: 'CJ',
   *   });
   * }).then(user => {
   *   // Resource
   * });
   * ```
   *
   * @async
   * @method update
   * @param {Object} fields
   * @return {Promise<Resource>}
   */
  update(fields, options = {}) {
    const { schema, id, conn } = this;
    const { type } = schema;

    const table = r.table(type);
    const reloadWithOptions = () => this.reload(options);

    Object.keys(fields).forEach(field => {
      if (!schema.hasAttribute(field)) delete fields[field];
    });

    return table
      .get(id)
      .update(fields)
      .run(conn)
      .then(reloadWithOptions);
  }

  /**
   * Removes the 'idToRemove' from this resource's 'hasOne' or 'belongsTo' relationship by setting
   * the resource pointer's _archived to true.
   *
   * @async
   * @private
   * @param {String} idToRemove
   * @param {String} field
   * @return {Object}
   */
  archiveRemoveIdFromRecordField(idToRemove, field) {
    if (typeof idToRemove !== 'string') {
      throw new TypeError(
        'Tried calling \'archiveRemoveIdFromRecordField\' with ' +
        '\'idToRemove\' that was not a string.'
      );
    }

    if (typeof field !== 'string') {
      throw new TypeError(
        'Tried calling \'archiveRemoveIdFromRecordField\' with \'field\' that was not a string.'
      );
    }

    const { schema: { type }, id, conn } = this;

    return archiveRemoveIdFromRecordField(type, id, field, idToRemove).run(conn);
  }

  /**
   * Removes the 'idToRemove' from each resource, indicated by the array of 'ids', by setting
   * each resource pointer's _archived to true.
   *
   * @async
   * @private
   * @param {String} type
   * @param {String[]} ids
   * @param {String} field
   * @return {Object}
   */
  archiveRemoveIdFromManyRecordsField(type, ids, field) {
    if (typeof type !== 'string') {
      throw new TypeError(
        'Tried calling \'archiveRemoveIdFromManyRecordsField\' with ' +
        '\'type\' that was not a String.'
      );
    }

    if (!Array.isArray(ids) || !ids.every(item => typeof item === 'string')) {
      throw new TypeError(
        'Tried calling \'archiveRemoveIdFromManyRecordsField\' with ' +
        '\'ids\' that was not an Array of Strings.'
      );
    }

    if (typeof field !== 'string') {
      throw new TypeError(
        'Tried calling \'archiveRemoveIdFromManyRecordsField\' with ' +
        '\'field\' that was not a String.'
      );
    }

    const { id: idToRemove, conn } = this;

    return archiveRemoveIdFromManyRecordsField(type, ids, field, idToRemove).run(conn);
  }

  /**
   * Splices all of the `idsToUpdate` from this resource's 'hasMany' relationship by setting each
   * resource pointer's `_archived` to true.
   *
   * @async
   * @private
   * @param {String} inverseType
   * @param {String} inverseField
   * @param {String[]} idsToUpdate
   * @param {String} idToSplice
   * @return {Object}
   */
  archiveSpliceIdFromInverseField(inverseType, inverseField, idsToUpdate, idToSplice) {
    if (typeof inverseType !== 'string') {
      throw new TypeError(
        'Tried calling \'archiveSpliceIdFromInverseField\' with ' +
        '\'inverseType\' that was not a String.'
      );
    }

    if (typeof inverseField !== 'string') {
      throw new TypeError(
        'Tried calling \'archiveSpliceIdFromInverseField\' with ' +
        '\'inverseField\' that was not a String.'
      );
    }

    if (!Array.isArray(idsToUpdate) || !idsToUpdate.every(item => typeof item === 'string')) {
      throw new TypeError(
        'Tried calling \'archiveSpliceIdFromInverseField\' with ' +
        '\'idsToUpdate\' that was not an Array of Strings.'
      );
    }

    if (typeof idToSplice !== 'string') {
      throw new TypeError(
        'Tried calling \'archiveSpliceIdFromInverseField\' with ' +
        '\'idToSplice\' that was not a String.'
      );
    }

    return archiveSpliceIdFromInverseField(inverseType, inverseField, idsToUpdate, idToSplice)
      .run(this.conn);
  }

  /**
   * Archives this resource and recursively archives its corresponding relationships.
   *
   * ```javascript
   * model('user').fetchResource('1').then(user => {
   *   return user.archive();
   * }).then(user => {
   *   // Resource
   * });
   * ```
   *
   * @async
   * @method archive
   * @param {Object} [options={}]
   * @return {Promise<Resource>}
   */
  archive(options = {}) {
    const { schema: { type }, id, conn } = this;
    const updateObject = getArchiveOriginalUpdateObject(this);
    const reloadWithOptions = () => this.reload(options);

    return r.table(type)
      .get(id)
      .update(updateObject)
      .run(conn)
      .then(::this.recursivelyArchive)
      .then(reloadWithOptions);
  }

  /**
   * Recursively archives this resource's corresponding relationships.
   *
   * @async
   * @private
   * @return {Promise}
   */
  recursivelyArchive() {
    const { id } = this;

    return Promise.all(
      Object.keys(this.relationships).map(field => {
        const {
          type,
          relation,
          inverse: {
            relation: inverseRelation,
            field: inverseField,
            type: inverseType,
          },
        } = this.relationship(field);

        if (relation === 'hasMany') {
          switch (inverseRelation) {
            case 'hasMany':
              return this.fetch(field)
                .then(resources => {
                  const idsToUpdate = resources.map(resource => resource.id);
                  return ::this.archiveSpliceIdFromInverseField(
                    inverseType,
                    inverseField,
                    idsToUpdate,
                    id
                  );
                });

            case 'belongsTo':
              return this.fetch(field)
                .then(resources =>
                  Promise.all(resources.map(resource =>
                    Promise.all([
                      resource.archive(),
                      resource.archiveRemoveIdFromRecordField(id, inverseField),
                    ])
                  ))
                );

            case 'hasOne':
              return this.fetch(field)
                .then(resources => {
                  const ids = resources.map(resource => resource.id);
                  return ::this.archiveRemoveIdFromManyRecordsField(type, ids, inverseField);
                });

            default:
              return true;
          }
        }

        if (relation === 'hasOne') {
          switch (inverseRelation) {
            case 'hasMany':
              return true;

            case 'belongsTo':
              return this.fetch(field)
                .then(resource =>
                  Promise.all([
                    resource.archive(),
                    resource.archiveRemoveIdFromRecordField(id, inverseField),
                  ])
                );

            case 'hasOne':
              return this.fetch(field)
                .then(resource => resource.archiveRemoveIdFromRecordField(id, inverseField));

            default:
              return true;
          }
        }

        if (relation === 'belongsTo') {
          switch (inverseRelation) {
            case 'hasMany':
              return true;

            case 'belongsTo':
              return true;

            case 'hasOne':
              return this.fetch(field)
                .then(resource => resource.archiveRemoveIdFromRecordField(id, inverseField));

            default:
              return true;
          }
        }

        return true;
      })
    );
  }

  /**
   * Assigns a resource to this resource's `hasOne` or `belongsTo` relationship identified
   * by `relationship`. The `data` argument can either be a Resource or String id.
   *
   * ```javascript
   * model('user').fetchResource('1').then(user => {
   *   return user.put('company', '1');
   * }).then(user => {
   *   // Resource
   * });
   *
   * model('user', 'company').map({
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
   * @method put
   * @param {String} relationship
   * @param {(String|Resource)} data
   * @param {Object} [options={}]
   * @return {Promise<Resource>}
   */
  put(relationship, data, options = {}) {
    const relationshipObject = this.relationship(relationship);
    const { relation, inverse, field } = relationshipObject;
    const { conn, schema, id } = this;
    const reloadWithOptions = () => this.reload(options);

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
          return putIdToRecordField(schema.type, id, field, idToPut).run(conn);

        case 'hasOne':
          return r.do(
            putIdToRecordField(schema.type, id, field, idToPut),
            putIdToRecordField(inverse.type, idToPut, inverse.field, id)
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
      .then(reloadWithOptions);
  }

  /**
   * Removes this resource's `hasOne` relationship. The `relationship` argument must be a
   * relationship String.
   *
   * ```javascript
   * model('user').fetchResource('1').then(user => {
   *   return user.remove('company');
   * }).then(user => {
   *   // Resource
   * });
   * ```
   *
   * @async
   * @method remove
   * @param {String} relationship
   * @param {Object} [options={}]
   * @return {Promise<Resource>}
   */
  remove(relationship, options = {}) {
    const relationshipObject = this.relationship(relationship);
    const { relation, inverse, record, field } = relationshipObject;
    const { relation: inverseRelation } = inverse;
    const { schema, id, conn } = this;
    const reloadWithOptions = () => this.reload(options);

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
          return removeIdFromRecordField(schema.type, id, field, record.id).run(conn);

        case 'hasOne':
          return r.do(
            removeIdFromRecordField(schema.type, id, field, record.id),
            removeIdFromRecordField(inverse.type, record.id, inverse.field, id)
          ).run(conn);

        default:
          throw new TypeError(
            'Tried calling \'remove\' on a resource whose inverse \'relationship\' ' +
            `is '${inverseRelation}'.`
          );
      }
    };

    return removeData().then(reloadWithOptions);
  }

  /**
   * Pushes data to this resource's `relationship`. The `data` can either be a `Resource`,
   * `ResourceArray`, array of Strings representing ids, or a String id.
   *
   * ```javascript
   * model('user').fetchResource('1').then(user => {
   *   return user.push('pets', ['1', '2']);
   * }).then(user => {
   *   const newPets = user.relationship('pets'); // will include pets with ids '1' and '2'
   * });
   *
   * model('user', 'animal:pets').map({
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
   * @method push
   * @param {String} relationship
   * @param {(String|String[]|Resource|ResourceArray)} data
   * @param {Object} [options={}]
   * @return {Promise<Resource>}
   */
  push(relationship, data, options = {}) {
    const relationshipObject = this.relationship(relationship);
    const { relation, inverse, field, records } = relationshipObject;
    const { schema, id, conn } = this;
    const reloadWithOptions = () => this.reload(options);

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

    const checkIsCompliantAndPushData = (isCompliant) => {
      if (!isCompliant) {
        throw new Error(
          'Tried calling \'push\' with \'data\' that violated Redink\'s update constraints.'
        );
      }

      return r.do(
        pushIdToOriginalField(schema.type, id, field, records, idsToPush),
        pushIdToInverseField(inverse.type, inverse.field, records, idsToPush, id)
      ).run(conn);
    };

    // Ensure `ids` is an array of id strings
    if (Array.isArray(data)) idsToPush = data;
    if (data instanceof ResourceArray) idsToPush = data.map(resource => resource.id);
    if (typeof data === 'string') idsToPush = [data];

    return isPushCompliant(relationshipObject, idsToPush, conn)
      .then(checkIsCompliantAndPushData)
      .then(reloadWithOptions);
  }

  /**
   * Splices data from the resource's `relationship`. The `data` can either be a `Resource`,
   * `ResourceArray`, array of Strings representing ids, or a String id.
   *
   * ```javascript
   * model('user').fetchResource('1').then(user => {
   *   return user.splice('pets', ['1', '2']);
   * }).then(user => {
   *   const newPets = user.relationship('pets'); // will not include pets with ids '1' and '2'
   * });
   *
   * model('user', 'animal:pets').map({
   *   user(model) {
   *     return model.fetchResource('1');
   *   },
   *   pets(model) {
   *     return model.find({ filter: { name: 'Lassy' } }),
   *   },
   * }).then(results => {
   *   const { user, pets } = results;
   *   return user.splice('pets', pets);
   * }).then(user => {
   *   const newPets = user.relationship('pets'); // will not include any pets with the name 'Lassy'
   * });
   * ```
   *
   * @async
   * @method splice
   * @param {String} relationship
   * @param {(String|String[]|Resource|ResourceArray)} data
   * @param {Object} [options={}]
   * @return {Promise<Resource>}
   */
  splice(relationship, data, options = {}) {
    const relationshipObject = this.relationship(relationship);
    const { relation, inverse, field } = relationshipObject;
    const { relation: inverseRelation } = inverse;
    const { schema, id, conn } = this;
    const reloadWithOptions = () => this.reload(options);

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
        spliceIdFromOriginalField(schema.type, field, id, idsToSplice),
        spliceIdFromInverseField(inverse.type, inverse.field, idsToSplice, id)
      ).run(conn);
    };

    return spliceData().then(reloadWithOptions);
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
   * Returns a plain object with the `id` key, an `attributes` key, a `relationships` key, and a
   * `meta` key.
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
