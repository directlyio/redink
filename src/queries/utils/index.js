import r from 'rethinkdb';

export const convertIdToResourcePointer = (id) => ({
  id,
  _archived: false,
  _related: true,
});

export const convertIdsToResourcePointers = (ids) => (
  ids.map(id => convertIdToResourcePointer(id))
);

export const getInverseIdsToUpdate = (originalOldIds = [], originalNewIds = []) => (
  r(originalOldIds)
    .setUnion(r(convertIdsToResourcePointers(originalNewIds)))
    .difference(r(originalOldIds))
);
