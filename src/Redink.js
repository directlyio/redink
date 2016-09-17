import r from 'rethinkdb';

import invalidRelationshipType from './errors/invalidRelationshipType';

import cascadeArchive from './utils/cascadeArchive';
import cascadePost from './utils/cascadePost';
import cascadeUpdate from './utils/cascadeUpdate';
import getFieldsToMerge from './utils/getFieldsToMerge';
import getRelationships from './utils/getRelationships';
import getTable from './utils/getTable';
import hasExistingRelationships from './utils/hasExistingRelationships';
import sanitizeRequest from './utils/sanitizeRequest';
import serialize from './utils/serialize';
import parseFilters from './utils/parseFilters';
import requestHasValidRelationships from './utils/requestHasValidRelationships';

import * as types from './constants/relationshipTypes';

export default class Redink {
  defaultPageLimit = 50

  constructor(schemas = {}, name = '', host = '', port = 28015) {
    this.schemas = schemas;
    this.name = name;
    this.host = host;
    this.port = port;
  }

  /**
   * Connect to a RethinkDB database.
   * Requires host and name to be defined or will reject the promise.
   *
   * @return {Object} - RethinkDB connection.
   */
  connect() {
    const { host, name, port } = this;

    if (process.env.REDINK_DEBUG) {
      console.log( // eslint-disable-line
        `Connect to RethinkDB at '${this.host}:${this.port}' with db '${this.name}'`
      );
    }

    return new Promise((resolve, reject) => {
      r.connect({ host, db: name, port }).then(conn => {
        this.conn = conn;
        return resolve(conn);
      }).catch(err => reject(err));
    });
  }

  disconnect() {
    if (process.env.REDINK_DEBUG) {
      console.log( // eslint-disable-line
        `Disconnecting from RethinkDB at '${this.host}:${this.port}' with db '${this.name}'`
      );
    }

    return this.conn.close();
  }

  /**
   * Creates a new record inside of table `type` with attributes and relationships specified in
   * `data`.
   *
   * ```js
   * db.create('user', {
   *   name: 'Dylan',
   *   email: 'dylanslack@gmail.com',
   *   pets: [1, 2],
   *   company: 1,
   * }).then(user => {
   *   // inserted object
   * });
   * ```
   *
   * @param {String} type - The table name.
   * @param {Object} data - Flattened JSON representing attributes and relationships.
   * @return {Object}
   */
  create(type, data) {
    if (process.env.REDINK_DEBUG) {
      console.log( // eslint-disable-line
        `Creating a record of type '${type}' at '${this.host}:${this.port}' with db '${this.name}'`
      );
    }

    const { conn, schemas } = this;
    const table = getTable(schemas, type);
    let returnId;

    const sanitizedData = sanitizeRequest(schemas, type, data);
    const fieldsToMerge = getFieldsToMerge(schemas, type);
    const finalize = (record) => serialize(schemas, type, record);
    const cascade = postArray => r.do(postArray).run(conn);
    const fetch = ({ generated_keys: keys }) =>
      table
        .get((keys && keys[0]) || data.id)
        .merge(fieldsToMerge)
        .run(conn);

    const handleRecord = record => {
      returnId = record.id;
      return cascadePost(record, type, conn, schemas);
    };

    const handleReturnFetch = () => fetch({
      generated_keys: [returnId],
    });

    return table
      .insert(sanitizedData)
      .run(conn)
      .then(fetch)
      .then(handleRecord)
      .then(cascade)
      .then(handleReturnFetch)
      .then(finalize);
  }

  /**
   * Updates the record with id `id` in table `type` with data `data`.
   *
   * ```js
   * db.update('user', 10, {
   *   name: 'Dy-lon',
   *   pets: [1, 2, 3],
   * }).then(user => {
   *   // updated object
   * });
   * ```
   *
   * @param {String} type - The table name.
   * @param {String)} id - The ID of the record that is going to be updated.
   * @param {Object} data - Flattened JSON representing attributes and relationships.
   * @return {Object}
   */
  update(type, id, data) {
    if (process.env.REDINK_DEBUG) {
      console.log( // eslint-disable-line
        `Updating a record of type '${type}' with id '${id}' at '${this.host}:${this.port}' with ` +
        `db '${this.name}'.`
      );
    }

    /* eslint-disable no-param-reassign */
    id = `${id}`;
    const { conn, schemas } = this;
    const table = getTable(schemas, type);
    const sanitized = sanitizeRequest(schemas, type, data, id);
    const hasValidRelationships = requestHasValidRelationships(schemas, type, data, true);
    const fieldsToMerge = getFieldsToMerge(schemas, type);

    const checkRelationships = (relationships) => hasExistingRelationships(type, id, relationships);
    const updateRecord = () => table.get(id).update(sanitized).run(conn);
    const updateArray = () => cascadeUpdate(type, id, data, schemas);
    const cascade = () => r.do(updateArray).run(conn);
    const fetch = () => table.get(id).merge(fieldsToMerge).run(conn);
    const finalize = (record) => serialize(schemas, type, record);

    return hasValidRelationships
      .run(conn)
      .then(checkRelationships)
      .then(updateRecord)
      .then(cascade)
      .then(fetch)
      .then(finalize);
  }

  /**
   * Archives the record with id `id` from the table `type`.
   *
   * ```js
   * db.delete('user', 10).then(success => {
   *   // true or false
   * });
   * ```
   *
   * @param {String} type - The table name.
   * @param {String} id - The ID of the record that is going to be deleted.
   * @return {Boolean}
   */
  archive(type, id) {
    if (process.env.REDINK_DEBUG) {
      console.log( // eslint-disable-line
        `Archiving a record of type '${type}' with id ${id} at '${this.host}:${this.port}' with ` +
        `db '${this.name}'.`
      );
    }

    /* eslint-disable no-param-reassign */
    id = `${id}`;
    const { conn, schemas } = this;
    const table = getTable(schemas, type);
    const query = cascadeArchive(id, type, conn, schemas);

    const fieldsToMerge = getFieldsToMerge(schemas, type);
    const fetch = () => table.get(id).merge(fieldsToMerge).run(conn);
    const runArchiveArray = (archiveArray) => r.do(archiveArray).run(conn);
    const finalize = (record) => serialize(schemas, type, record);

    return query
      .then(runArchiveArray)
      .then(fetch)
      .then(finalize);
  }

  /**
   * Finds all records from the table `type` that match `filter`.
   *
   * ```js
   * db.find('user', {
   *   name: 'Dylan',
   * }).then(users => {
   *   // all users with name 'Dylan'
   * });
   * ```
   *
   * @param {String} type - The table name.
   * @param {(Object|Function)} [fiter={}] - The RethinkDB filter object or function.
   * @param {(Object)} [pagination={}] - A pagination object with the optional keys `limit` and
   *                                   `skip`
   * @return {Object[]}
   */
  find(type, filter = {}, pagination = {}) {
    if (process.env.REDINK_DEBUG) {
      console.log( // eslint-disable-line
        `Finding a record of type '${type}' at '${this.host}:${this.port}' with db '${this.name}'`
      );
    }

    const { conn, schemas, defaultPageLimit } = this;
    const { skip, limit } = pagination;

    const table = getTable(schemas, type);
    const relationships = getRelationships(schemas, type);
    const fieldsToMerge = getFieldsToMerge(schemas, type);
    const parsedFilters = parseFilters(filter, relationships);
    const finalize = ([count, records]) => serialize(schemas, type, records, count);

    // filter out archived entities
    parsedFilters.meta = { archived: false };

    return r.do([
      table.filter(parsedFilters).count(),
      table.filter(parsedFilters)
        .orderBy('id')
        .skip(skip || 0)
        .limit(limit || defaultPageLimit)
        .merge(fieldsToMerge)
        .coerceTo('array'),
    ]).run(conn).then(finalize);
  }

  /**
   * Fetches a single record from table `table` with id `id`.
   *
   * ```js
   * db.fetch('user', 10).then(user => {
   *   // fetched object
   * });
   * ```
   *
   * @param {String} type - The table name.
   * @param {String} id - The ID of the record that is going to be fetched.
   * @return {Object}
   */
  fetch(type, id) {
    if (process.env.REDINK_DEBUG) {
      console.log( // eslint-disable-line
        `Fetching a record of type '${type}' with id '${id}' at '${this.host}:${this.port}' with ` +
        `db '${this.name}'.`
      );
    }

    /* eslint-disable no-param-reassign */
    id = `${id}`;
    const { conn, schemas } = this;
    const table = r.table(type);
    const fieldsToMerge = getFieldsToMerge(schemas, type);
    const finalize = (record) => serialize(schemas, type, record);

    return table
      .get(id)
      .merge(fieldsToMerge)
      .run(conn)
      .then(finalize);
  }

  /**
   * Fetches the `field` relationship from the record with id `id` from the table `type`.
   *
   * ```js
   * db.fetchRelated('user', 10, 'pets').then(pets => {
   *   // all the pets
   * });
   *
   * db.fetchRelated('user', 10, 'company').then(company => {
   *   // company
   * });
   * ```
   *
   * @param {String} type - The table name.
   * @param {String} id - The ID of the record that is going to be fetched.
   * @return {(Object|Object[])}
   */
  fetchRelated(type, id, field, filter = {}, pagination = {}) {
    if (process.env.REDINK_DEBUG) {
      console.log( // eslint-disable-line
        `Fetching '${field}' from a record of type '${type}' with id '${id}' at ` +
        `'${this.host}:${this.port}' with db '${this.name}'.`
      );
    }

    /* eslint-disable no-param-reassign */
    id = `${id}`;
    const { conn, schemas } = this;

    const parentTable = getTable(schemas, type);
    const relationships = getRelationships(schemas, type);
    const parsedFilters = parseFilters(filter, relationships);

    if (!relationships.hasOwnProperty(field)) {
      throw invalidRelationshipType(type, field);
    }

    const { defaultPageLimit } = this;
    const { skip, limit } = pagination;
    const { table: relatedType, original: relationshipType } = relationships[field];

    const relatedTable = getTable(schemas, relatedType);
    const fieldsToMerge = getFieldsToMerge(schemas, relatedType);

    if (relationshipType === types.HAS_MANY) {
      const finalize = ([count, records]) => serialize(schemas, relatedType, records, count);

      const ids = r.args(
        parentTable.get(id)(field).filter(rel => r.not(rel('archived')))('id')
      );

      // filter out archived entities
      parsedFilters.meta = { archived: false };

      return r.do([
        relatedTable.getAll(ids).filter(parsedFilters).count(),
        relatedTable.getAll(ids).filter(parsedFilters)
          .orderBy('id')
          .skip(skip || 0)
          .limit(limit || defaultPageLimit)
          .merge(fieldsToMerge)
          .coerceTo('array'),
      ]).run(conn).then(finalize);
    }

    const finalize = (record) => serialize(schemas, relatedType, record);

    return relatedTable
      .get(parentTable.get(id)(field)('id'))
      .merge(fieldsToMerge)
      .run(conn)
      .then(finalize);
  }
}
