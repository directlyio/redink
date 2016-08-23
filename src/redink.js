import r from 'rethinkdb';
import { RedinkDatabaseError } from 'redink-errors';
import sanitizeRequest from './utils/sanitizeRequest';
import serializeResponse from './utils/serializeResponse';
import getFieldsToMerge from './utils/getFieldsToMerge';
import cascadeArchive from './utils/cascadeArchive';
import cascadeUpdate from './utils/cascadeUpdate';
import cascadePost from './utils/cascadePost';

export default class Redink {
  constructor(schemas = {}, name = '', host = '') {
    this.schemas = schemas;
    this.name = name;
    this.host = host;
  }

  /**
   * Connect to a RethinkDB database.
   * Requires host and name to be defined or will reject the promise.
   *
   * @throws {RedinkDatabaseError} - Error describing why the connection could not be made.
   *
   * @return {Object} - RethinkDB connection.
   */
  connect() {
    const { host, name } = this;

    return new Promise((resolve, reject) => {
      r.connect({ host, db: name }).then(conn => {
        this.conn = conn;
        return resolve(conn);
      }).catch(err => {
        reject(
          new RedinkDatabaseError(`Could not connect to the database: ${err.message}`)
        );
      });
    });
  }

  disconnect() {
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
   * @throws {RedinkDatabaseError} - Chained error message passed to @see reject().
   *
   * @param {String} type - The table name.
   * @param {Object} data - Flattened JSON representing attributes and relationships.
   * @return {Object}
   */
  create(type, data) {
    const { conn, schemas } = this;
    const table = r.table(type);
    let returnId;

    const sanitizedData = sanitizeRequest(schemas[type], data);
    const fieldsToMerge = getFieldsToMerge(schemas, type);
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

    return new Promise((resolve, reject) => {
      table
        .insert(sanitizedData)
        .run(conn)
        .then(fetch)
        .then(handleRecord)
        .then(cascade)
        .then(handleReturnFetch)
        .then(record => resolve(serializeResponse(schemas[type], record)))
        .catch(err => (
          reject(
            new RedinkDatabaseError(`Error creating record of type '${type}': ${err.message}`)
          )
        ));
    });
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
   * @throws {RedinkDatabaseError} - Chained error message passed to @see reject().
   *
   * @param {String} type - The table name.
   * @param {String)} id - The ID of the record that is going to be updated.
   * @param {Object} data - Flattened JSON representing attributes and relationships.
   * @return {Object}
   */
  update(type, id, data) {
    /* eslint-disable no-param-reassign */
    id = `${id}`;
    const { conn, schemas } = this;
    const table = r.table(type);

    const sanitized = sanitizeRequest(schemas[type], data, 'update');
    const updateArray = cascadeUpdate(type, id, data, schemas);
    const fieldsToMerge = getFieldsToMerge(schemas, type);
    const fetch = () => table.get(id).merge(fieldsToMerge).run(conn);
    const cascade = () => r.do(updateArray).run(conn);

    return new Promise((resolve, reject) => {
      table
        .get(id)
        .update(sanitized)
        .run(conn)
        .then(cascade)
        .then(fetch)
        .then(record => resolve(serializeResponse(schemas[type], record)))
        .catch(/* istanbul ignore next */ err => (
          reject(
            new RedinkDatabaseError(`Error updating record of type '${type}': ${err.message}`)
          )
        ));
    });
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
   * @throws {RedinkDatabaseError} - Chained error message passed to @see reject().
   *
   * @param {String} type - The table name.
   * @param {String} id - The ID of the record that is going to be deleted.
   * @return {Boolean}
   */
  archive(type, id) {
    /* eslint-disable no-param-reassign */
    id = `${id}`;
    const { conn, schemas } = this;
    const table = r.table(type);
    const query = new Promise((resolve) =>
      resolve(cascadeArchive(id, type, conn, schemas)));

    const fieldsToMerge = getFieldsToMerge(schemas, type);
    const fetch = () => table.get(id).merge(fieldsToMerge).run(conn);

    return query.then(reql => (
      new Promise((resolve, reject) => {
        r.do(reql)
          .run(conn)
          .then(fetch)
          .then(resolve)
          .catch(/* istanbul ignore next */ err => (
            reject(
              new RedinkDatabaseError(`Error archiving record of type '${type}': ${err.message}`)
            )
          ));
      })
    ));
  }

  /**
   * Cleares all records from the table `type`.
   *
   * ```js
   * db.clearTable('user').then(success => {
   *   // true or false
   * });
   * ```
   *
   * @throws {RedinkDatabaseError} - Chained error message passed to @see reject().
   *
   * @param {String} type - The table name.
   * @return {Boolean}
   */
  clearTable(type) {
    const { conn } = this;
    const table = r.table(type);
    const didSucceed = ({ errors }) => errors === 0;

    return new Promise((resolve, reject) => {
      table
        .delete()
        .run(conn)
        .then(didSucceed)
        .then(resolve)
        .catch(/* istanbul ignore next */ err => (
          reject(
            new RedinkDatabaseError(`Error clearing table of type '${type}': ${err.message}`)
          )
        ));
    });
  }

  /**
   * Finds all records from the table `type` that match `filter`.
   *
   * ```js
   * db.find('user', {
   *   name: 'Dylan',
   * }).then(user => {
   *   // found object
   * });
   * ```
   *
   * @throws {RedinkDatabaseError} - Chained error message passed to @see reject().
   *
   * @param {String} type - The table name.
   * @param {(Object|Function)} [fiter={}] - The RethinkDB filter object or function.
   * @return {Object[]}
   */
  find(type, filter = {}) {
    const { conn, schemas } = this;
    const table = r.table(type);
    const fieldsToMerge = getFieldsToMerge(schemas, type);

    return new Promise((resolve, reject) => {
      table
        .filter(filter)
        .merge(fieldsToMerge)
        .coerceTo('array')
        .orderBy('id')
        .run(conn)
        .then(records => (
          resolve(records.map(record => serializeResponse(schemas[type], record)))
        ))
        .catch(/* istanbul ignore next */ err => (
          reject(
            new RedinkDatabaseError(`Error finding record of type '${type}': ${err.message}`)
          )
        ));
    });
  }

  /**
   * Fetches a single record from table `table` with id `id`;
   *
   * ```js
   * db.fetch('user', 10).then(user => {
   *   // fetched object
   * });
   * ```
   *
   * @throws {RedinkDatabaseError} - Chained error message passed to @see reject().
   *
   * @param {String} type - The table name.
   * @param {String} id - The ID of the record that is going to be fetched.
   * @return {Object}
   */
  fetch(type, id) {
    /* eslint-disable no-param-reassign */
    id = `${id}`;
    const { conn, schemas } = this;
    const table = r.table(type);
    const fieldsToMerge = getFieldsToMerge(schemas, type);

    return new Promise((resolve, reject) => {
      table
        .get(id)
        .merge(fieldsToMerge)
        .run(conn)
        .then(record => resolve(serializeResponse(schemas[type], record)))
        .catch(/* istanbul ignore next */ err => (
          reject(
            new RedinkDatabaseError(`Error fetching record of type '${type}': ${err.message}`)
          )
        ));
    });
  }

  /**
   * Fetches the `field` relationship from the record with id `id` from the table `type`;
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
  fetchRelated(type, id, field) {
    /* eslint-disable no-param-reassign */
    id = `${id}`;
    const { conn, schemas } = this;

    const parentTable = r.table(type);
    const relationship = schemas[type].relationships[field];
    const { hasMany, belongsTo, embedded } = relationship;

    const relatedTable = hasMany
      ? r.table(hasMany)
      : r.table(belongsTo);

    let fetch;

    if (embedded) {
      fetch = parentTable.get(id)(field);
    } else {
      fetch = hasMany
        ? relatedTable.getAll(r.args(parentTable.get(id)(field)('id'))).coerceTo('array')
        : relatedTable.get(parentTable.get(id)(field)('id'));
    }

    const fieldsToMerge = getFieldsToMerge(schemas, hasMany || belongsTo);

    return new Promise((resolve, reject) => {
      fetch
        .merge(fieldsToMerge)
        .run(conn)
        .then(resolve)
        .catch(err => (
          reject(
            new RedinkDatabaseError(`Error fetching related of type '${type}': ${err.message}`)
          )
        ));
    });
  }
}
