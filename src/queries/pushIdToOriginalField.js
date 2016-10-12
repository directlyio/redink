import r from 'rethinkdb';
import { getInverseIdsToUpdate } from './utils';

export default (originalType, originalId, originalField, originalOldIds, originalNewIds) => (
  r.do(
    getInverseIdsToUpdate(originalOldIds, originalNewIds), ids => (
      r.table(originalType).get(originalId).update(row => ({
        [originalField]: row(originalField).union(r(ids)),
      }))
    )
  )
);
