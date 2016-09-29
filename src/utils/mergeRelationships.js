import r from 'rethinkdb';

/**
 * Determines which relationships to sideload in the table based off the schema's relationships
 * and `options.include`.
 *
 * ```
 * // example options
 * const options = {
 *   pets: true,
 *   company: false,
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

    const relatedTable = r.table(type);
    const hasFields = record.hasFields(field);

    const transaction = relation === 'hasMany'
      ? relatedTable.getAll(r.args(record(field)('id'))).coerceTo('array')
      : relatedTable.get(record(field)('id'));

    return r.branch(hasFields, {
      [field]: transaction,
    }, {});
  })));

  // eslint-disable-next-line
  table = table.merge(fieldsToMerge);

  return table;
};
