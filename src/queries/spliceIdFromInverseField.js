import r from 'rethinkdb';

export default (inverseType, inverseField, idsToUpdate, idToSplice) => (
  r.table(inverseType).getAll(r.args(idsToUpdate)).update(row => ({
    [inverseField]: row(inverseField).map(data => (
      r.branch(data('id').eq(idToSplice),
        {
          id: data('id'),
          _archived: data('_archived'),
          _related: false,
        }, data
      )
    )),
  }))
);
