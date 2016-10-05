/* eslint-disable no-param-reassign */
export default (table, id, options) => {
  table = table.get(id);

  if (typeof options !== 'object') return table;

  if ('pluck' in options) {
    // always pluck the id
    options.pluck.id = true;
    table = table.pluck(options.pluck);
  }

  if ('without' in options) {
    // disallow forgoing the id
    options.without.id = false;
    table = table.without(options.without);
  }

  return table;
};
