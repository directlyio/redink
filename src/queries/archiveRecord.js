import r from 'rethinkdb';

/**
 * Archive a single record.
 * Set the `archived` field in the `meta` object of a record to `true`.
 *
 * ```
 * // example RethinkDB query
 * r.table('enterprise').get('100').update({ meta: { archived: true } })
 *
 * // record before archive
 * {
 *   id: '100',
 *   name: 'Company 1',
 *   meta: {
 *     archived: false,
 *   },
 *   relationships: {
 *     ...
 *   },
 * }
 *
 * // record after archive
 * {
 *   id: '100',
 *   name: 'Company 1',
 *   meta: {
 *     archived: true,
 *   },
 *   relationships: {
 *     ...
 *   },
 * }
 * ```
 *
 * @param {String} table - The table to be selected.
 * @param {String} id - The ID of the record to be archived.
 * @return {Object} - RethinkDB query.
 */
export default (table, id) => (
  r.table(table).get(id).update({ meta: { archived: true } })
);
