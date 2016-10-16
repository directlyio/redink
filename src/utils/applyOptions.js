import hasOwnProperty from './hasOwnProperty';

export default (table, options) => {
  if (typeof options !== 'object') return table;

  let row = table;

  if (hasOwnProperty(options, 'filter')) {
    row = row.filter(options.filter);
  }

  if (hasOwnProperty(options, 'pluck')) {
    // always pluck the id
    row = row.pluck({
      ...options.include,
      id: true,
    });
  }

  if (hasOwnProperty(options, 'without')) {
    // disallow forgoing the id
    row = row.without({
      ...options.without,
      id: false,
    });
  }

  if (hasOwnProperty(options, 'between')) {
    row = row.between(options.between);
  }

  if (hasOwnProperty(options, 'skip')) {
    row = row.skip(options.skip);
  }

  if (hasOwnProperty(options, 'limit')) {
    row = row.limit(options.limit);
  }

  if (hasOwnProperty(options, 'orderBy')) {
    row = row.orderBy(options.orderBy);
  }

  return row;
};
