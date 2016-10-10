import r from 'rethinkdb';

export default (inverseType, inverseId, inverseField, id) => (
  r.table(inverseType).get(inverseId).update(record => ({
    [inverseField]: {
      id,
      _archived: true,
      _related: record(inverseField)('_related'),
    },
  }))
);
