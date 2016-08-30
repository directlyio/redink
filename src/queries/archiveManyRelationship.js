import r from 'rethinkdb';

/**
 * Archive/patch a relationship in a `hasMany` relationship.
 * Sets the `archived` field to `true` in the relationship array of objects.
 * This is so the client can easily filter out the 'deleted/archived' records.
 *
 * ```
 * // example RethinkDB query
 * r.table('enterprise').get('100').update(row => ({
 *   'listings': row('listings').map(data => (
 *      r.branch(data('id').eq('1111'),
 *       {
 *         id: data('id'),
 *         archived: true,
 *       }, {
 *         id: data('id'),
 *         archived: data('archived'),
 *       })
 *   )),
 * }))
 *
 * // relationship before archive
 * {
 *   id: '100',
 *   name: 'Company 1',
 *   meta: {
 *     archived: true,
 *   },
 *   relationships: {
 *     listings: [
 *       {
 *         id: '1111',
 *         archived: false,
 *       },
 *       {
 *         id: '2222',
 *         archived: false,
 *       },
 *     ],
 *     ...
 *   },
 * }
 *
 * // relationship after archive
 * {
 *   id: '100',
 *   name: 'Company 1',
 *   meta: {
 *     archived: true,
 *   },
 *   relationships: {
 *     listings: [
 *       {
 *         id: '1111',
 *         archived: true,
 *       },
 *       {
 *         id: '2222',
 *         archived: false,
 *       },
 *     ],
 *     ...
 *   },
 * }
 * ```
 *
 * @param {String} table - The table to be selected.
 * @param {String} field - The field to parse through.
 * @param {String} tableId - The ID of the record to patch.
 * @param {String} fieldId - The ID of the relationship to archive.
 * @return {Object} - RethinkDB query.
 */
export default (table, field, tableId, fieldId) => (
  r.table(table).get(tableId).update(row => ({
    [field]: row(field).map(data => (
      r.branch(data('id').eq(fieldId),
        {
          id: data('id'),
          archived: true,
        }, {
          id: data('id'),
          archived: data('archived'),
        })
    )),
  }))
);
