import r from 'rethinkdb';
import missingNewIdsError from '../errors/missingNewIds';
import missingOldIdsError from '../errors/missingOldIds';

/**
 * Archive the ID of the relationships that are returned from `setUnion` and `difference`
 * (@link https://github.com/endfire/redink/wiki).
 *
 * ```
 * // example RethinkDB query
 * r.do(r(['1', '2', '3']).setUnion(['1', '4']).difference(r(['1', '4'])), ids => (
 *   ids.forEach(id => (
 *     r.table('user').get(id).update(row => ({
 *       'blogs': row('blogs').map(data => (
 *         r.branch(data('id').eq('100'),
 *           {
 *             id: data('id'),
 *             archived: true,
 *           }, {
 *             id: data('id'),
 *             archived: data('archived'),
 *           }
 *         )
 *       )),
 *     }))
 *   ))
 * ))
 *
 * // example update
 * {
 *   id: '100',
 *   name: 'Ben Frankline',
 *   blogs: {
 *     old: ['1', '2', '3'],
 *     new: ['1', 4'],
 *   },
 * }
 * ```
 *
 * @param  {String} table - Name of the table to update.
 * @param  {String} inverseField - Name of the field to update.
 * @param  {Object} record - Object containing old and new data.
 * @param  {String} archiveId - ID to archive in the fields array.
 * @return {Object} - RethinkDB query.
 */
export default (table, inverseField, record, archiveId) => {
  const { old: oldIds, new: newIds, id: recordId } = record;

  if (!oldIds) {
    throw missingOldIdsError(table, inverseField, recordId);
  }

  if (!newIds) {
    throw missingNewIdsError(table, inverseField, recordId);
  }

  return r.do(r(oldIds).setUnion(newIds).difference(r(newIds)), ids => (
    ids.forEach(id => (
      r.table(table).get(id).update(row => ({
        [inverseField]: row(inverseField).map(data => (
          r.branch(data('id').eq(archiveId),
            {
              id: data('id'),
              archived: true,
            }, {
              id: data('id'),
              archived: data('archived'),
            }
          )
        )),
      }))
    ))
  ));
};
