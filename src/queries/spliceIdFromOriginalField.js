import r from 'rethinkdb';

export default (originalType, originalField, originalId, idsToSplice) => (
  r.table(originalType).get(originalId).update(row => ({
    [originalField]: row(originalField).map(data => (
      r.branch(r(idsToSplice).contains(data('id')),
        {
          id: data('id'),
          _archived: data('_archived'),
          _related: false,
        }, data
      )
    )),
  }))
);
