import r from 'rethinkdb';
import applyOptions from './applyOptions';
import hasOwnProperty from './hasOwnProperty';
import requiresIndex from './requiresIndex';

/**
 * Determines which relationships to sideload in the table based off the schema's relationships
 * and `options.include`.
 *
 * ```
 * // example options
 * const options = {
 *   include: {
 *     pets: true,
 *     company: true,
 *     blogs: {
 *       filter: (blog) => blog('title').contains('javascript'),
 *       pluck: {
 *         title: true,
 *         createdOn: true,
 *       },
 *       include: { // THIS WON'T WORK (yet)
 *         author: true
 *       },
 *     },
 *   },
 * };
 * ```
 *
 * Missing relationship keys in `options` are interpreted as `false`.
 *
 * @param {Object} table
 * @param {Object} schema
 * @param {Object} options
 * @returns {Function}
 */
export default (table, schema, options) => {
  if (!('include' in options)) return table;

  const { relationships } = schema;
  const fields = Object.keys(relationships);

  const fieldsToMerge = (record) => r({}).merge(r.args(fields.map(field => {
    if (
      !hasOwnProperty(options.include, field) ||
      !Boolean(options.include[field])
    ) return {};

    const { type, relation, inverse } = relationships[field];
    let relatedTable = r.table(type);

    if (relation === 'hasMany') {
      if (requiresIndex(relation, inverse.relation)) {
        relatedTable = relatedTable.getAll(record('id'), { index: inverse.field });
      } else {
        relatedTable = relatedTable.getAll(r.args(record(field)('id')));
      }

      relatedTable = relatedTable.coerceTo('array');
    } else {
      relatedTable = relatedTable.get(record(field)('id'));
    }

    relatedTable = applyOptions(relatedTable, options.include[field]);

    return { [field]: relatedTable };
  })));

  // eslint-disable-next-line
  table = table.merge(fieldsToMerge);

  return table;
};
