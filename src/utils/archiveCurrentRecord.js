/* eslint-disable no-param-reassign */

/**
 * Add the current record (`table` and `id`) to the archive property of the `archiveObject`.
 *
 * @param {Object} archiveObject - Object used to indicate what should be archived and patched.
 * @param {String} table - Table pulled from the archival queue.
 * @param {String} id - ID pulled from the archival queue.
 * @return {Object} archiveObject
*/
export default (archiveObject, table, id) => {
  if (!archiveObject.archive[table]) {
    archiveObject.archive[table] = { [id]: true };
  } else {
    archiveObject.archive[table][id] = true;
  }

  return archiveObject;
};
