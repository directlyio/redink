import r from 'rethinkdb';
import applyOptions from './applyOptions';
import createConnection from './createConnection';
import hasOwnProperty from './hasOwnProperty';
import requiresIndex from './requiresIndex';

const mergeWithIndex = (table, type, record, field, index, options) => {
  const edges = table.getAll(record('id'), { index });

  return { [field]: createConnection(type, edges, options) };
};

const mergeWithManyRecords = (table, type, record, field, options) => {
  const edges = table.getAll(r.args(record(field)('id')));

  return { [field]: createConnection(type, edges, options) };
};

const mergeWithSingleRecord = (table, record, field, options) => {
  let row = table;

  row = row.get(record(field)('id'));
  row = applyOptions(row, options);

  return { [field]: row };
};

/**
 * Determines which relationships to sideload in the table based off the type's relationships
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
 *       include: { // this works, but is incredibly slow
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
 * @param {Type} type
 * @param {Object} options
 * @returns {Function}
 */
export default (table, type, options) => {
  if (!hasOwnProperty(options, 'include')) return table;

  const { relationships } = type;
  const fields = Object.keys(relationships);

  const fieldsToMerge = (record) => r({}).merge(r.args(fields.map(field => {
    if (
      !hasOwnProperty(options.include, field) ||
      !Boolean(options.include[field])
    ) return {};

    const { name, relation, inverse, type: relatedType } = relationships[field];
    const relatedTable = r.table(name);
    const inverseField = inverse.field;
    const fieldOptions = options.include[field];

    if (relation === 'hasMany') {
      if (requiresIndex(relation, inverse.relation)) {
        return mergeWithIndex(
          relatedTable,
          relatedType,
          record,
          field,
          inverseField,
          fieldOptions,
        );
      }

      return record.hasFields(field).branch(
        mergeWithManyRecords(
          relatedTable,
          relatedType,
          record,
          field,
          fieldOptions,
        ),
        {},
      );
    }

    return record.hasFields(field).branch(
      mergeWithSingleRecord(
        relatedTable,
        record,
        field,
        fieldOptions,
      ),
      {},
    );
  })));

  // eslint-disable-next-line
  table = table.merge(fieldsToMerge);

  return table;
};
