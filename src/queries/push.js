import r from 'rethinkdb';

export default (inverseTable, inverseField, oldIds, newIds, idToPush) => (
  r.do(r(oldIds).setUnion(newIds).difference(r(oldIds)), ids => (
    r.table(inverseTable).getAll(r.args(ids)).update(row => ({
      [inverseField]: row(inverseField).append({
        id: idToPush,
        _archived: false,
        _related: true,
      }),
    }))
  ))
);
