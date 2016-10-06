export default (table, id, options) => {
  let row = table.get(id);

  if (typeof options !== 'object') return row;

  if ('pluck' in options) {
    // always pluck the id
    row = row.pluck({
      ...options.pluck,
      id: true,
    });
  }

  if ('without' in options) {
    // disallow forgoing the id
    row = row.without({
      ...options.without,
      id: false,
    });
  }

  return row;
};
