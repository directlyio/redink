import r from 'rethinkdb';

/**
 * Archive/patch a relationship that is either `belongsTo` or `hasOne`.
 * Sets the `archived` field to `true` in the relationship object.
 * This is so the client can know to filter out the 'deleted/archived' record.
 *
 * // example RethinkDB query
 * r.table('listing').get('1111').update({
 *   'company': {
 *     id: '100'
 *     archived: true,
 *   },
 * })
 *
 * // relationship before archive
 * {
 *   id: '1111',
 *   name: 'Listing 1',
 *   meta: {
 *     archived: true,
 *   },
 *   relationships: {
 *     company: {
 *       id: '100',
 *       archived: false,
 *     },
 *     ...
 *   },
 * }
 *
 * // relationship after archive
 * {
 *   id: '1111',
 *   name: 'Listing 1',
 *   meta: {
 *     archived: true,
 *   },
 *   relationships: {
 *     company: {
 *       id: '100',
 *       archived: true,
 *     },
 *     ...
 *   },
 * }
 * ```
 *
 * @param {String} table - The table to be selected.
 * @param {String} field - The field to archive.
 * @param {String} tableId - The ID of the record to patch.
 * @param {String} fieldId - The ID of the relationship to archive.
 * @return {Object} - RethinkDB query.
 */
export default (table, field, tableId, fieldId) => (
  r.table(table).get(tableId).update({
    [field]: {
      id: fieldId,
      archived: true,
    },
  })
);
