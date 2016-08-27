import r from 'rethinkdb';
import missingNewIdsError from '../errors/missingNewIds';
import missingOldIdsError from '../errors/missingOldIds';

/**
 * Append the ID of the relationships that are returned from `setUnion` and `difference`
 * (@link https://github.com/endfire/redink/wiki).
 *
 * ```
 * // example RethinkDB query
 * r.do(r(['1', '2', '3']).setUnion(['1', '4']).difference(r(['1', '2', '3'])), ids => (
 *   ids.forEach(id => (
 *     r.table('users').get(id).update(row => ({
 *       'blogs': row('blogs').append({ id: '100', archived: false }),
 *     }))
 *   ))
 * ))
 *
 * // example update
 * {
 *   id: '100',
 *   name: 'Ben Franklin',
 *   blogs: {
 *     old: ['1', '2', '3'],
 *     new: ['1', 4'],
 *   },
 * }
 * ```
 *
 * @param  {String} table - Name of the table to update.
 * @param  {String} inverseField - Name of the field to update.
 * @param  {Object} record - Object containing old and new record.
 * @param  {String} appendId - ID to append to the field.
 * @return {Object} - RethinkDB query.
 */
export default (table, inverseField, record, appendId) => {
  const { old: oldIds, new: newIds, id: recordId } = record;

  if (!oldIds) {
    throw missingOldIdsError(table, inverseField, recordId);
  }

  if (!newIds) {
    throw missingNewIdsError(table, inverseField, recordId);
  }

  return r.do(r(oldIds).setUnion(newIds).difference(r(oldIds)), (ids) => (
    ids.forEach(id => (
      r.table(table).get(id).update(row => ({
        [inverseField]: row(inverseField).append({ id: appendId, archived: false }),
      }))
    ))
  ));
};
