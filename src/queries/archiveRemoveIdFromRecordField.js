import r from 'rethinkdb';

export default (type, id, field, idToRemove) => (
  r.table(type).get(id).update(row => ({
    [field]: {
      id: idToRemove,
      _archived: true,
      _related: row(field)('_related'),
    },
  }))
);
