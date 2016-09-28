/* eslint-disable no-param-reassign */
export default (table, options) => {
  if ('filter' in options) {
    table = table.filter(options.filter);
  }

  if ('pluck' in options) {
    table = table.pluck(options.pluck);
  }

  if ('include' in options) {
    table = table.merge(options.include);
  }

  table = table.coerceTo('array');

  return table;
};
