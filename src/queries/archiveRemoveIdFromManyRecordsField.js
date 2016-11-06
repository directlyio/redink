import r from 'rethinkdb';

export default (name, ids, field, idToRemove) => (
  r.table(name).getAll(r.args(ids)).update(row => ({
    [field]: {
      id: idToRemove,
      _archived: true,
      _related: row(field)('_related'),
    },
  }))
);
