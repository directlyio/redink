import r from 'rethinkdb';
import { getInverseIdsToUpdate } from './utils';

export default (originalName, originalId, originalField, originalOldIds, originalNewIds) => (
  r.do(
    getInverseIdsToUpdate(originalOldIds, originalNewIds), ids => (
      r.table(originalName).get(originalId).update(row => ({
        [originalField]: row(originalField).union(r(ids)),
      }))
    )
  )
);
