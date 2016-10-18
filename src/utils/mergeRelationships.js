import r from 'rethinkdb';
import applyOptions from './applyOptions';
import hasOwnProperty from './hasOwnProperty';
import requiresIndex from './requiresIndex';

const mergeWithIndex = (table, record, field, index, options) => {
  let row = table;

  row = row.getAll(record('id'), { index });
  row = row.coerceTo('array');
  row = applyOptions(row, options);

  return { [field]: row };
};

const mergeWithManyRecords = (table, record, field, options) => {
  let row = table;

  row = row.getAll(r.args(record(field)('id')));
  row = row.coerceTo('array');
  row = applyOptions(row, options);

  return { [field]: row };
};

const mergeWithSingleRecord = (table, record, field, options) => {
  let row = table;

  row = row.get(record(field)('id'));
  row = applyOptions(row, options);

  return { [field]: row };
};

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
    const relatedTable = r.table(type);

    if (relation === 'hasMany') {
      if (requiresIndex(relation, inverse.relation)) {
        return mergeWithIndex(
          relatedTable,
          record,
          field,
          inverse.field,
          options.include[field],
        );
      }

      return record.hasFields(field).branch(
        mergeWithManyRecords(
          relatedTable,
          record,
          field,
          options.include[field],
        ),
        {},
      );
    }

    return record.hasFields(field).branch(
      mergeWithSingleRecord(
        relatedTable,
        record,
        field,
        options.include[field],
      ),
      {},
    );
  })));

  // eslint-disable-next-line
  table = table.merge(fieldsToMerge);

  return table;
};
