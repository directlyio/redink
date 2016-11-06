import r from 'rethinkdb';

export default (name, id, field, idToRemove) => (
  r.table(name).get(id).update(row => ({
    [field]: {
      id: idToRemove,
      _archived: true,
      _related: row(field)('_related'),
    },
  }))
);
