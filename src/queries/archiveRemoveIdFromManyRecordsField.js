import r from 'rethinkdb';

export default (type, ids, field, idToRemove) => (
  r.table(type).getAll(r.args(ids)).update(row => ({
    [field]: {
      id: idToRemove,
      _archived: true,
      _related: row(field)('_related'),
    },
  }))
);
