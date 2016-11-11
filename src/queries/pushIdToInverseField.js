import r from 'rethinkdb';
import {
  convertIdToResourcePointer,
  getInverseIdsToUpdate,
} from './utils';

export default (name, inverseField, originalOldIds, originalNewIds, idToPush) => (
  r.do(
    getInverseIdsToUpdate(originalOldIds, originalNewIds), ids => (
      r.table(inverseName).getAll(r.args(ids.map(id => id('id')))).update(row => ({
        [inverseField]: row(inverseField).append(convertIdToResourcePointer(idToPush)),
      }))
    )
  )
);
