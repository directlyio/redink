import r from 'rethinkdb';

export default (inverseType, inverseId, inverseField, id) => (
  r.table(inverseType).get(inverseId).update(row => ({
    [inverseField]: {
      id,
      _archived: row(inverseField)('_archived'),
      _related: false,
    },
  }))
);
