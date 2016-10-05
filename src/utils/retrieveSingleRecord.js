export default (table, id, options) => {
  let row = table.get(id);

  if ('pluck' in options) {
    // always pluck the id
    row = row.pluck({
      ...options.pluck,
      id: true,
    });
  }

  return row;
};
