import r from 'rethinkdb';
import retrieveManyRecords from './retrieveManyRecords';
import retrieveSingleRecord from './retrieveSingleRecord';

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
      !options.include.hasOwnProperty(field) ||
      !Boolean(options.include[field])
    ) return {};

    const { type, relation } = relationships[field];
    const hasFields = record.hasFields(field);

    let relatedTable = r.table(type);

    if (relation === 'hasMany') {
      relatedTable = relatedTable.getAll(r.args(record(field)('id')));
      relatedTable = retrieveManyRecords(relatedTable, options.include);
    } else {
      relatedTable = retrieveSingleRecord(relatedTable, record(field)('id'), options.include);
    }

    return r.branch(hasFields, {
      [field]: relatedTable,
    }, {});
  })));

  // eslint-disable-next-line
  table = table.merge(fieldsToMerge);

  return table;
};
