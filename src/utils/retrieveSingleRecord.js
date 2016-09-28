/* eslint-disable no-param-reassign */
export default (table, id, options) => {
  table = table.get(id);

  if ('pluck' in options) {
    table = table.pluck(options.pluck);
  }

  if ('include' in options) {
    table = table.merge(options.include);
  }

  return table;
};
