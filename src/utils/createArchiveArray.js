import archiveRecord from '../queries/archiveRecord';
import { traversePatchObject } from './';

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
export default (archiveObject, schemas) => {
  const archiveArray = [];
  const { archive, patch } = archiveObject;
  const { keys } = Object;

  keys(archive).forEach(table =>
    keys(archive[table]).forEach(id =>
      archiveArray.push(archiveRecord(table, id))));

  archiveArray.push(...traversePatchObject(patch, schemas));

  return archiveArray;
};
