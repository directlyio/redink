/* eslint-disable no-param-reassign */
import r from 'rethinkdb';
import Connection from './Connection';
import Relationship from './Relationship';

import {
  isPushCompliant,
  isPutCompliant,
  isRemoveCompliant,
  isSpliceCompliant,
} from './constraints/update';

import {
  applyOptions,
  createConnection,
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

export default class Node {
  /**
   * Instantiates a Node.
   *
   * @class Node
   * @param {Object} conn
   * @param {Type} type
   * @param {Object} data
   */
  constructor(conn, type, data) {
    if (!conn) {
      throw new TypeError('A valid RethinkDB connection is required to instantiate a Node.');
    }

    if (!type) {
      throw new TypeError('A valid type is required to instantiate a Node.');
    }

    if (!data) {
      // FIXME: need to return null if data doesn't exist
      throw new TypeError('A valid data is required to instantiate a Node.');
    }

    this.conn = conn;
    this.type = type;
    this.id = data.id;
    this.meta = data._meta || {};
    this.attributes = {};
    this._relationships = {};

    // build attributes
    type.attributes.forEach(({ field }) => {
      this.attributes[field] = data[field];
    });

    // build relationships
    type.relationships.forEach(({ field }) => {
      this._relationships[field] = new Relationship(conn, type, field, data[field]);
    });
  }

  /**
   * Returns an attribute.
   *
   * ```javascript
   * model('user').fetch('1').then(user => {
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
   * Returns the node's relationship.
   *
   * ```javascript
   * model('user').fetch('1').then(user => {
   *   user.relationship('pets') instanceof Relationship {
   *     type: Type,
   *     relation: 'hasMany',
   *     inverse: {
   *       name: 'user',
   *       relation: 'belongsTo',
   *       field: 'owner',
   *     },
   *   }
   *
   *   user.relationship('teachers') instanceof Relationship {
   *     type: Type,
   *     relation: 'hasMany',
   *     inverse: {
   *       name: 'user',
   *       relation: 'hasMany',
   *       field: 'students',
   *     },
   *     data: {
   *       edges: [{
   *       	 cursor: '<opaque>',
   *       	 node: {
   *       	   id: '1',
   *       	   _archived: false,
   *       	   _related: false,
   *       	 },
   *       }, {
   *         cursor: '<opaque>',
   *         node: {
   *           id: '2',
   *           _archived: false,
   *           _related: false,
   *         },
   *       }],
   *       totalCount: 2,
   *       pageInfo: {
   *         startCursor: '<opaque>',
   *         endCursor: '<opaque>',
   *         hasPreviousPage: true,
   *         hasNextPage: true,
   *       },
   *     },
   *   }
   *
   *   user.relationship('company') instanceof Relationship {
   *     type: Type,
   *     relation: 'hasOne',
   *     inverse: {
   *       name: 'user',
   *       relation: 'hasMany',
   *       field: 'employees',
   *     },
   *     data: {
   *       id: '2',
   *       _archived: false,
   *       _related: true,
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
   * Get this node's relationships.
   *
   * ```
   * model('user').fetch('1').then(user => {
   *   const hasCompany = user.relationships.ofType('company');
   *
   *   return user.update({
   *     isEmployed: hasCompany,
   *   });
   * });
   * ```
   *
   * @return {Object}
   */
  get relationships() {
    const relationships = this._relationships;

    return {
      ...relationships,

      map(fn) {
        return Object.keys(relationships).map(key => fn(relationships[key]));
      },

      forEach(fn) {
        Object.keys(relationships).forEach(key => fn(relationships[key]));
      },

      reduce(fn, initialValue) {
        return Object.keys(relationships).reduce((init, key) =>
          fn(init, relationships[key]), initialValue);
      },

      ofType(name) {
        return Object.keys(relationships).reduce((prev, curr) => {
          if (relationships[curr].type.name !== name) return prev;

          if (prev === null) {
            return {
              [curr]: relationships[curr],
            };
          }

          return {
            ...prev,
            [curr]: relationships[curr],
          };
        }, null);
      },
    };
  }

  /**
   * Returns an updated version of the resource.
   *
   * @async
   * @method reload
   * @param {Object} [options={}]
   * @return {Promise<Node>}
   */
  reload(options = {}) {
    const { type, id, conn } = this;

    let query = r.table(type.name);

    query = query.get(id);
    query = mergeRelationships(query, type, options);
    query = applyOptions(query, options);

    return query.run(conn)
      .then(data => new Node(conn, type, data))
      .catch(() => null);
  }

  /**
   * Fetches either the `Node` or `Connection` related to this resource by `relationship`.
   *
   * ```javascript
   * model('user').fetch('1').then(user => {
   *   return user.fetch('company');
   * }).then(company => {
   *   // Node
   * });
   * ```
   *
   * @async
   * @method fetch
   * @param {String} relationship
   * @param {Object} [options={}]
   * @return {Promise<Node|Connection|null>}
   */
  fetch(relationship, options = {}) {
    if (!this.relationship(relationship)) {
      return Promise.resolve(null);
    }

    const { conn, id } = this;

    const {
      type,
      relation,
      inverse,
      data,
    } = this.relationship(relationship);

    let query = r.table(type.name);

    if (relation === 'hasMany') {
      // FIXME: remove this util with Relationship.requiresIndex
      if (requiresIndex(relation, inverse.relation)) {
        query = query.getAll(id, { index: inverse.field });
      } else {
        query = query.getAll(r.args(data.map(record => record.id)));
      }

      return createConnection(type, query, options).run(conn)
        .then(newData => new Connection(conn, type, newData));
    }

    query = query.get(data.id);
    query = applyOptions(query, options);
    query = mergeRelationships(query, type, options);

    return query.run(conn)
      .then(newData => new Node(conn, type, newData))
      .catch(() => null);
  }

  /**
   * Returns the resource pointer(s) based on the multipicity of `relationship`. For example,
   * if `relationship` is a M:N relationship, this method will return an array of pointers. If
   * `relationship` is a 1:M relationship, this method will return a single pointer.
   *
   * ```javascript
   * model('user').fetch('1').then(user => {
   *   user.retrieve('pets') === [{
   *     id: '1',
   *     _archived: false,
   *     _related: false,
   *   }]
   *
   *   user.retrieve('company') === {
   *     id: '1',
   *     _archived: false,
   *     _related: false,
   *   }
   * });
   * ```
   *
   * @method relationship
   * @param {String} relationship
   * @return {(Object[]|Object)}
   */
  retrieve(relationship) {
    if (!this.relationship(relationship)) return null;

    return this.relationship(relationship).data;
  }


  /**
   * Updates this resource's attributes.
   *
   * ```javascript
   * model('user').fetch('1').then(user => {
   *   return user.update({
   *     name: 'CJ',
   *   });
   * }).then(user => {
   *   // Node
   * });
   * ```
   *
   * @async
   * @method update
   * @param {Object} fields
   * @param {Object} [options={}]
   * @return {Promise<Node>}
   */
  update(fields, options = {}) {
    const { type, id, conn } = this;
    const { name } = type;

    const table = r.table(name);
    const reloadWithOptions = () => this.reload(options);

    Object.keys(fields).forEach(field => {
      if (!type.hasAttribute(field)) delete fields[field];
    });

    return table
      .get(id)
      .update(fields)
      .run(conn)
      .then(reloadWithOptions);
  }

  /**
   * Updates the node's `relationships.`
   *
   * @async
   * @param {Object} fields
   * @param {Object} options
   * @return {Object}
   */
  updateRelationships(fields, options = {}) {
    const { relationships } = this;
    const splice = ::this.splice;
    const put = ::this.put;
    const remove = ::this.remove;
    const push = ::this.push;
    const reloadWithOptions = () => ::this.reload(options);
    const mutations = [];

    Object.keys(fields).forEach(field => {
      const relationship = relationships[field];

      if (relationship) {
        const { relation } = relationship;

        switch (relation) {
          case 'hasOne': {
            if (fields[field]) mutations.push(() => put(field, fields[field], options));
            else mutations.push(remove(field, options));
            break;
          }

          case 'hasMany': {
            const { data } = relationship;
            const ids = data.map(({ id }) => id);

            const idsToSplice = ids.filter(item => !fields[field].includes(item));

            mutations.push(splice(field, idsToSplice, options));
            mutations.push(push(field, fields[field], options));
            break;
          }

          // eslint-disable-next-line
          case 'belongsTo':
          default: {
            throw new TypeError(
              'Tried calling \'updateRelationships\' on a belongsTo relationship.'
            );
          }
        }
      }
    });

    return Promise.all(mutations).then(reloadWithOptions);
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

    const { type: { name }, id, conn } = this;

    return archiveRemoveIdFromRecordField(name, id, field, idToRemove).run(conn);
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
  archiveRemoveIdFromManyRecordsField(name, ids, field) {
    if (typeof name !== 'string') {
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

    return archiveRemoveIdFromManyRecordsField(name, ids, field, idToRemove).run(conn);
  }

  /**
   * Splices all of the `idsToUpdate` from this resource's 'hasMany' relationship by setting each
   * resource pointer's `_archived` to true.
   *
   * @async
   * @private
   * @param {String} inverseName
   * @param {String} inverseField
   * @param {String[]} idsToUpdate
   * @param {String} idToSplice
   * @return {Object}
   */
  archiveSpliceIdFromInverseField(inverseName, inverseField, idsToUpdate, idToSplice) {
    if (typeof inverseName !== 'string') {
      throw new TypeError(
        'Tried calling \'archiveSpliceIdFromInverseField\' with ' +
        '\'inverseName\' that was not a String.'
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

    return archiveSpliceIdFromInverseField(inverseName, inverseField, idsToUpdate, idToSplice)
      .run(this.conn);
  }

  /**
   * Archives this resource and recursively archives its corresponding relationships.
   *
   * ```javascript
   * model('user').fetch('1').then(user => {
   *   return user.archive();
   * }).then(user => {
   *   // Node
   * });
   * ```
   *
   * @async
   * @method archive
   * @param {Object} [pre={}] - Critera before merging relationships.
   * @param {Object} [post={}] - Critera after merging relationships.
   * @return {Promise<Node>}
   */
  archive(options = {}) {
    const { type: { name }, id, conn } = this;
    const updateObject = getArchiveOriginalUpdateObject(this);
    const reloadWithOptions = () => this.reload(options);

    return r.table(name)
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
      Object.keys(this._relationships).map(field => {
        const {
          type,
          relation,
          inverse: {
            relation: inverseRelation,
            field: inverseField,
            name: inverseName,
          },
        } = this.relationship(field);

        if (relation === 'hasMany') {
          switch (inverseRelation) {
            case 'hasMany':
              // FIXME: the IDs should already be available on this resource, no need to fetch
              return this.fetch(field)
                .then(resources => {
                  const idsToUpdate = resources.map(resource => resource.id);
                  return ::this.archiveSpliceIdFromInverseField(
                    inverseName,
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
              // FIXME: the ID should already be available on this resource, no need to fetch
              return this.fetch(field)
                .then(resources => {
                  const ids = resources.map(resource => resource.id);
                  return ::this.archiveRemoveIdFromManyRecordsField(type.name, ids, inverseField);
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
   * by `relationship`. The `data` argument can either be a Node or String id.
   *
   * ```javascript
   * model('user').fetch('1').then(user => {
   *   return user.put('company', '1');
   * }).then(user => {
   *   // Node
   * });
   *
   * model('user', 'company').map({
   *   user(model) {
   *     return model.fetch('1');
   *   },
   *   company(model) {
   *     return model.fetch('1');
   *   },
   * }).then(results => {
   *   const { user, company } = results;
   *   return user.put('company', company);
   * }).then(user => {
   *   // Node
   * });
   * ```
   *
   * @async
   * @method put
   * @param {String} relationship
   * @param {(String|Node)} data
   * @param {Object} [options={}]
   * @return {Promise<Node>}
   */
  put(relationship, data, options = {}) {
    const relationshipObject = this.relationship(relationship);
    const { relation, inverse, field } = relationshipObject;
    const { conn, type, id } = this;
    const reloadWithOptions = () => this.reload(options);

    let idToPut;

    if (relation !== 'hasOne' && relation !== 'belongsTo') {
      // FIXME: this isn't really the case for belongsTo?
      throw new TypeError(
        `Tried calling 'put' on a resource whose 'relationship' is '${relation}'. This method ` +
        'only works for resources whose \'relationship\' is \'hasOne\' or \'belongsTo\'.'
      );
    }

    if (!(data instanceof Node || typeof data === 'string')) {
      throw new TypeError(
        'Tried calling \'put\' with \'data\' that was neither a Node nor a String.'
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
          return putIdToRecordField(type.name, id, field, idToPut).run(conn);

        case 'hasOne':
          return r.do(
            putIdToRecordField(type.name, id, field, idToPut),
            putIdToRecordField(inverse.name, idToPut, inverse.field, id)
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
    if (data instanceof Node) idToPut = data.id;

    return isPutCompliant(relationshipObject, idToPut, conn)
      .then(putData)
      .then(reloadWithOptions);
  }

  /**
   * Removes this resource's `hasOne` relationship. The `relationship` argument must be a
   * relationship String.
   *
   * ```javascript
   * model('user').fetch('1').then(user => {
   *   return user.remove('company');
   * }).then(user => {
   *   // Node
   * });
   * ```
   *
   * @async
   * @method remove
   * @param {String} relationship
   * @param {Object} [pre={}] - Critera before merging relationships.
   * @param {Object} [post={}] - Critera after merging relationships.
   * @return {Promise<Node>}
   */
  remove(relationship, options = {}) {
    const relationshipObject = this.relationship(relationship);
    const { relation, inverse, data, field } = relationshipObject;
    const { relation: inverseRelation } = inverse;
    const { type, id, conn } = this;
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
          return removeIdFromRecordField(type.name, id, field, data.id).run(conn);

        case 'hasOne':
          return r.do(
            removeIdFromRecordField(type.name, id, field, data.id),
            removeIdFromRecordField(inverse.name, data.id, inverse.field, id)
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
   * Pushes data to this resource's `relationship`. The `data` can either be a `Node`,
   * `Connection`, array of Strings representing ids, or a String id.
   *
   * ```javascript
   * model('user').fetch('1').then(user => {
   *   return user.push('pets', ['1', '2']);
   * }).then(user => {
   *   const newPets = user.relationship('pets'); // will include pets with ids '1' and '2'
   * });
   *
   * model('user', 'animal:pets').map({
   *   user(model) {
   *     return model.fetch('1');
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
   * @param {(String|String[]|Node|Connection)} data
   * @param {Object} [pre={}] - Critera before merging relationships.
   * @param {Object} [post={}] - Critera after merging relationships.
   * @return {Promise<Node>}
   */
  push(relationship, data, options = {}) {
    const relationshipObject = this.relationship(relationship);
    const { relation, inverse, field, data: records } = relationshipObject;
    const { type, id, conn } = this;
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
        'Tried calling \'push\' with \'data\' that was neither a Node, Connection, ' +
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
        pushIdToOriginalField(type.name, id, field, records, idsToPush),
        pushIdToInverseField(inverse.name, inverse.field, records, idsToPush, id)
      ).run(conn);
    };

    // Ensure `ids` is an array of id strings
    if (Array.isArray(data)) idsToPush = data;
    if (data instanceof Connection) idsToPush = data.map(resource => resource.id);
    if (typeof data === 'string') idsToPush = [data];

    return isPushCompliant(relationshipObject, idsToPush, conn)
      .then(checkIsCompliantAndPushData)
      .then(reloadWithOptions);
  }

  /**
   * Splices data from the resource's `relationship`. The `data` can either be a `Node`,
   * `Connection`, array of Strings representing ids, or a String id.
   *
   * ```javascript
   * model('user').fetch('1').then(user => {
   *   return user.splice('pets', ['1', '2']);
   * }).then(user => {
   *   const newPets = user.relationship('pets'); // will not include pets with ids '1' and '2'
   * });
   *
   * model('user', 'animal:pets').map({
   *   user(model) {
   *     return model.fetch('1');
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
   * @param {(String|String[]|Node|Connection)} data
   * @param {Object} [pre={}] - Critera before merging relationships.
   * @param {Object} [post={}] - Critera after merging relationships.
   * @return {Promise<Node>}
   */
  splice(relationship, data, options = {}) {
    const relationshipObject = this.relationship(relationship);
    const { relation, inverse, field } = relationshipObject;
    const { relation: inverseRelation } = inverse;
    const { type, id, conn } = this;
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
        'Tried calling \'splice\' with \'data\' that was neither a Node, Connection, ' +
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
      if (data instanceof Connection) idsToSplice = data.map(resource => resource.id);
      if (typeof data === 'string') idsToSplice = [data];

      return r.do(
        spliceIdFromOriginalField(type.name, field, id, idsToSplice),
        spliceIdFromInverseField(inverse.name, inverse.field, idsToSplice, id)
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
