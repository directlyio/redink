/* eslint-disable no-param-reassign */
export default (table, options) => {
  if (typeof options !== 'object') return table;

  let row = table;

  if (options.hasOwnProperty('filter')) {
    row = row.filter(options.filter);
  }

  if (options.hasOwnProperty('pluck')) {
    // always pluck the id
    row = row.pluck({
      ...options.include,
      id: true,
    });
  }

  if (options.hasOwnProperty('without')) {
    // disallow forgoing the id
    row = row.without({
      ...options.without,
      id: false,
    });
  }

  if (options.hasOwnProperty('between')) {
    row = row.between(options.between);
  }

  if (options.hasOwnProperty('skip')) {
    row = row.skip(options.skip);
  }

  if (options.hasOwnProperty('limit')) {
    row = row.limit(options.limit);
  }

  if (options.hasOwnProperty('orderBy')) {
    row = row.orderBy(options.orderBy);
  }

  return row;
};
