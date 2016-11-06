import r from 'rethinkdb';

export default (originalName, originalField, originalId, idsToSplice) => (
  r.table(originalName).get(originalId).update(row => ({
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
