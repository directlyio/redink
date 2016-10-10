import r from 'rethinkdb';

export default (inverseType, inverseId, inverseField, id) => (
  r.table(inverseType).get(inverseId).update({
    [inverseField]: {
      id,
      _archived: false,
      _related: true,
    },
  })
);
