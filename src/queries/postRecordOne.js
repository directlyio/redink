import r from 'rethinkdb';

/**
 * Updates a `hasOne` relationship with a new record ID. This function is for cascade-posting a
 * `hasOne` relationship (@link cascadePost).
 *
 * ```
 * // example RethinkDB query
 * r.table('user').get('1').update({
 *   'house': {
 *     id: '1',
 *     archived: false,
 *   },
 * })
 *
 * // record before post
 * {
 *   id: '1',
 *   name: 'Thomas Jefferson',
 *   meta: {
 *     archived: false,
 *   },
 * }
 *
 * //record after post
 * {
 *   id: '1',
 *   name: 'Thomas Jefferson',
 *   meta: {
 *     archived: false,
 *   },
 *   house: {
 *     id: '1',
 *     archived: false,
 *   },
 * }
 * ```
 *
 * @param  {String} table - Name of the table to update.
 * @param  {String} tableId - ID of the table to update.
 * @param  {String} field - Name of the field to update.
 * @param  {String} fieldId - ID to relace the field.
 * @return {Object} - RethinkDB query.
 */
export default (table, tableId, field, fieldId) => (
  r.table(table).get(tableId).update({
    [field]: {
      id: fieldId,
      archived: false,
    },
  })
);
