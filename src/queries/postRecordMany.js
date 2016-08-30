import r from 'rethinkdb';

/**
 * Appends an ID to the inverse relationship's array. This function is for cascade-posting a
 * `hasMany` relationship (@link cascadePost).
 *
 * ```
 * // example RethinkDB query
 * r.table('user').get('1').update(row => ({
 *   'blogs': row('blogs').append(
 *     {
 *       id: '2',
 *       archived: false,
 *     }),
 *   )
 * }))
 *
 * // record before post
 * {
 *   id: '1',
 *   name: 'George Washington',
 *   meta: {
 *     archived: false,
 *   },
 *   blogs: [{
 *     id: '1',
 *     archived: false,
 *   }],
 * }
 *
 * // record after post
 * {
 *   id: '1',
 *   name: 'George Washington',
 *   meta: {
 *     archived: false,
 *   },
 *   listings: [{
 *     id: '1',
 *     archived: false,
 *   }, {
 *     id: '2',
 *     archived: false,
 *   }],
 * }
 * ```
 *
 * @param  {String} table - Name of the table to update
 * @param  {String} tableId - ID of the table to update.
 * @param  {String} field - Name of the field to update.
 * @param  {String} fieldId - ID to append to the field.
 * @return {Object} - RethinkDB query.
 */
export default (table, tableId, field, fieldId) => (
  r.table(table).get(tableId).update(row => ({
    [field]: row(field).append(
      {
        id: fieldId,
        archived: false,
      }),
  }))
);
