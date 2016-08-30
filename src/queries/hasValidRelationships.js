import r from 'rethinkdb';

export default (table, ids) => (
  r.table(table)
    .getAll(r.args(r(ids)))
    .count()
    .eq(r(ids).count())
);
