import getArchiveObject from './getArchiveObject';
import traversePatchObject from './traversePatchObject';
import archiveRecord from '../queries/archiveRecord';

/**
 * Create the archive array to pass to r.do().
 * Loops through the @see getArchiveObject to parse `archive` and `patch`.
 * For each object in `archive` we archive the record with {@link archiveRecord}.
 * For each object in `patch` we call @see traversePatchObject.
 *
 * ```
 * // returns array of RethinkDB queries
 * [
 *   r.table('enterprise').get('100').update(...),
 *   r.table('listing').get('1111').update(...),
 *   ...
 * ]
 * ```
 *
 * @param  {Object} archiveObject - Object returned from getArchiveObject.
 * @param  {Object} schemas - Schemas passed in from db instance.
 * @return {Array} - Array of RethinkDB queries.
 */
export const createArchiveArray = (archiveObject, schemas) => {
  const archiveArray = [];
  const { archive, patch } = archiveObject;
  const { keys } = Object;

  keys(archive).forEach(table =>
    keys(archive[table]).forEach(id =>
      archiveArray.push(archiveRecord(table, id))));

  archiveArray.push(...traversePatchObject(patch, schemas));

  return archiveArray;
};

/**
 * Archive the relationships of a record that is 'deleted'.
 * Called in services delete method {@link Database.delete}.
 * Gets the archiveObject from @see getArchiveObject and passes it to @see createArchiveArray.
 *
 * ```
 * // example call with params
 * cascadeArchive('100', 'enterprise', conn, schemas);
 * ```
 *
 * @param {String} id - ID of record to archive.
 * @param {String} table - Table name of record to archive.
 * @param {Object} connection - Connection to rethink database.
 * @param {Object} schemas - Schemas to determine relationship type.
 * @return {Boolean}
 */
export default (id, table, connection, schemas) => (
  getArchiveObject(id, table, schemas, connection)
    .then(archiveObject => createArchiveArray(archiveObject, schemas))
);
