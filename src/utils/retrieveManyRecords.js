/* eslint-disable no-param-reassign */
export default (table, options) => {
  if (typeof options !== 'object') return table;

  if ('filter' in options) {
    table = table.filter(options.filter);
  }

  if ('pluck' in options) {
    // always pluck the id
    options.pluck.id = true;
    table = table.pluck(options.pluck);
  }

  if ('between' in options) {
    table = table.between(options.between);
  }

  if ('skip' in options) {
    table = table.skip(options.skip);
  }

  if ('limit' in options) {
    table = table.limit(options.limit);
  }

  if ('orderBy' in options) {
    table = table.orderBy(options.orderBy);
  }

  table = table.coerceTo('array');

  return table;
};
