/* eslint-disable no-param-reassign */
export default (table, options) => {
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

  table = table.coerceTo('array');

  return table;
};
