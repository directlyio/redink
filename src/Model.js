import r from 'rethinkdb';
import Connection from './Connection';
import Node from './Node';
import isCreateCompliant from './constraints/create';

import {
  applyOptions,
  createConnection,
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
   * @param {Object} conn
   * @param {String} type
   */
  constructor(conn, type) {
    if (!conn) {
      throw new TypeError('Argument "conn" is required to instantiate a Model.');
    }

    if (!type) {
      throw new TypeError('Argument "type" is required to instantiate a Model.');
    }

    this.conn = conn;
    this.type = type;
  }

  /**
   * Creates a connection whose edges match the criteria in `options`.
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
   *   // Connection
   * });
   * ```
   *
   * @async
   * @method find
   * @param {Object} [options={}]
   * @return {Promise<Connection>}
   *
   * @todo Write more docs on `options`
   */
  find(options = {}) {
    const { conn, type } = this;
    const connection = createConnection(type, r.table(type.name), options);

    return connection.run(conn).then(data => new Connection(conn, type, data));
  }

  /**
   * Finds the first node that matches the criteria in `options.`
   *
   * @async
   * @method findOne
   * @param {Object} [options={}]
   * @return {Promise<Node>}
   */
  findOne(options = {}) {
    return this.find(options).then(connection => connection.first());
  }

  /**
   * Creates a connection using the index named `index`.
   *
   * ```
   * model('user').findByIndex('email', 'dylanslack@gmail.com').then(users => {
   *   // Connection
   * });
   * ```
   *
   * @async
   * @method findByIndex
   * @param {String} index - The index name.
   * @param {*} value
   * @param {Object} [options={}]
   * @return {Promise<Connection>}
   *
   * @todo Add test.
   */
  findByIndex(index, value, options = {}) {
    const { conn, type } = this;

    const connection = createConnection(
      type,
      r.table(type.name).getAll(value, { index }),
      options
    );

    return connection.run(conn).then(data => new Connection(conn, type, data));
  }

  /**
   * Creates a connection by finding records with ids in `ids`.
   *
   * ```
   * model('user').findByIds(['1', '2', '3']).then(users => {
   *   // Connection
   * });
   * ```
   *
   * @async
   * @method findByIds
   * @param {String} index - The index name.
   * @param {Array<String>} ids
   * @param {Object} [options={}]
   * @return {Promise<Connection>}
   *
   * @todo Add test.
   */
  findByIds(index, ids, options = {}) {
    const { conn, type } = this;

    const connection = createConnection(
      type,
      r.table(type.name).getAll(r.args(ids)),
      options
    );

    return connection.run(conn).then(data => new Connection(conn, type, data));
  }

  /**
   * Finds a single node from `index` that matches `value` and that matches the criteria in
   * `options`.
   *
   * @async
   * @method findOneByIndex
   * @param {String} index - The index name.
   * @param {*} value
   * @param {Object} [options={}] - Critera before merging relationships.
   * @return {Promise<Node>}
   */
  findOneByIndex(index, value, options = {}) {
    return this.findByIndex(index, value, options).then(connection => connection.first());
  }

  /**
   * Retrieves the resource(s) related to a particular resource identified by `id` according to
   * `relationship`. A relationship with a relation of `hasMany` returns a `Connection`, and a
   * relationship with a relation of `hasOne` or `belongsTo` returns a `Node`.
   *
   * ```js
   * // pretend user `1` has a ton of pets
   * model('user').findRelated('1', 'pets', {
   *   filter: { species: 'hamster' },
   * }).then(pets => {
   *   // Connection
   * });
   *
   * // pretend user `1` has a company
   * model('user').findRelated('1', 'company').then(company => {
   *   // Node
   * });
   * ```
   *
   * @async
   * @method findRelated
   * @param {String} id - The id of the parent resource.
   * @param {String} relationship - The relationship to the parent.
   * @param {Object} [options={}]
   * @returns {Promise<Connection|Node>}
   */
  findRelated(id, relationship, options = {}) {
    const { conn, type, type: { name: parentName } } = this;

    const {
      name: relatedName,
      type: relatedSchema,
      relation,
      inverse,
    } = type.relationships[relationship];

    let query = r.table(relatedName);

    if (relation === 'hasMany') {
      if (requiresIndex(relation, inverse.relation)) {
        query = query.getAll(id, { index: inverse.field });
      } else {
        query = query.getAll(
          r.args(r.table(parentName).get(id)(relationship)('id'))
        );
      }

      return createConnection(relatedSchema, query, options).run(conn)
        .then(data => new Connection(conn, relatedSchema, data));
    }

    query = query.get(r.table(parentName).get(id)(relationship)('id'));
    query = mergeRelationships(query, relatedSchema, options);
    query = applyOptions(query, options);

    return query.run(conn)
      .then(data => new Node(conn, relatedSchema, data))
      .catch(() => null);
  }

  /**
   * Fetches the node with `id`.
   *
   * ```js
   * model('user').fetch('1').then(user => {
   *   // Node
   * });
   * ```
   *
   * @async
   * @method fetch
   * @param {String} id - The ID of the resource to retrieve.
   * @param {Object} [options={}] - Critera before merging relationships.
   * @returns {Promise<Node>}
   */
  fetch(id, options = {}) {
    const { conn, type } = this;

    let query = r.table(type.name).get(id);
    query = mergeRelationships(query, type, options);
    query = applyOptions(query, options);

    return query.run(conn)
      .then(data => new Node(conn, type, data))
      .catch(() => null);
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
   *   // Node
   * });
   * ```
   *
   * @async
   * @method create
   * @param {Object} record
   * @param {Object} [options={}] - Critera before merging relationships.
   * @returns {Promise<Node>}
   */
  create(record, options = {}) {
    const { conn, type } = this;
    const { name } = type;

    const checkComplianceAndNormalizeRecord = (compliant) => {
      if (!compliant) {
        throw new Error(
          'Tried to create a record, but \'record\' had some invalid relationships.'
        );
      }

      return normalizeRecord(record, type);
    };

    const createRecord = (normalizedRecord) => {
      let createdNode;

      return r.table(name).insert(normalizedRecord).run(conn)

        // retrieve the record that was just created
        .then(({ generated_keys: keys }) => this.fetch(keys[0], options))

        // create the node and sync its relationships
        .then(node => {
          createdNode = node;

          const syncRelationshipsArray = syncRelationships(record, type, node.id);
          return r.do(syncRelationshipsArray).run(conn);
        })

        // return the node
        .then(() => createdNode);
    };

    // check record and its relationships for Redink constraints
    return isCreateCompliant(record, type, conn)
      .then(checkComplianceAndNormalizeRecord)
      .then(createRecord);
  }
}
