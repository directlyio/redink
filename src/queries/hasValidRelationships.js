import r from 'rethinkdb';

export default (table, idOrIds) => {
  /* eslint-disable no-param-reassign */
  if (!Array.isArray(idOrIds)) {
    return r.table(table).get(idOrIds);
  }

  return r.table(table)
    .getAll(r.args(r(idOrIds)))
    .count()
    .eq(r(idOrIds).count());
};
