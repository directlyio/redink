import r from 'rethinkdb';

export default (inverseTable, inverseField, oldIds, newIds, idToSplice) => (
  r.do(r(oldIds).setUnion(newIds).difference(r(newIds)), ids => (
    r.table(inverseTable).getAll(r.args(ids)).update(row => ({
      [inverseField]: row(inverseField)
        .filter(data => data('id').eq(idToSplice))
        .map(data => ({
          id: data('id'),
          _archived: true,
          _related: data('_related'),
        })),
    }))
  ))
);
