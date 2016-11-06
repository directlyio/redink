import r from 'rethinkdb';

export default (inverseName, inverseField, idsToUpdate, idToSplice) => (
  r.table(inverseName).getAll(r.args(idsToUpdate)).update(row => ({
    [inverseField]: row(inverseField).map(data => (
      r.branch(data('id').eq(idToSplice),
        {
          id: data('id'),
          _archived: true,
          _related: data('_related'),
        }, data
      )
    )),
  }))
);
