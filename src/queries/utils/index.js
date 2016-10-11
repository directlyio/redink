import r from 'rethinkdb';

export const convertId = (id) => ({
  id,
  _archived: false,
  _related: true,
});

export const convertManyIds = (ids) => (
  ids.map(id => convertId(id))
);

export const getInverseIdsToUpdate = (originalOldIds, originalNewIds) => (
  r(originalOldIds).setUnion(r(convertManyIds(originalNewIds))).difference(r(originalOldIds))
);
