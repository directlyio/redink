/* eslint-disable no-param-reassign */
import hasOwnProperty from './hasOwnProperty';

export default (query, options) => {
  if (typeof options !== 'object') return query;

  let row = query;

  if (hasOwnProperty(options, 'filter')) {
    row = row.filter(options.filter);
  }

  if (hasOwnProperty(options, 'pluck')) {
    // always pluck the id
    row = row.pluck({
      ...options.pluck,
      id: true,
    });
  }

  if (hasOwnProperty(options, 'without')) {
    // disallow forgoing the id
    delete options.without.id;
    row = row.without(options.without);
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
