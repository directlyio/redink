import r from 'rethinkdb';
import {
  convertId,
  getInverseIdsToUpdate,
} from './utils';

export default (inverseType, inverseField, originalOldIds, originalNewIds, idToPush) => (
  r.do(
    getInverseIdsToUpdate(originalOldIds, originalNewIds), ids => (
      r.table(inverseType).getAll(r.args(ids.map(id => id('id')))).update(row => ({
        [inverseField]: row(inverseField).append(convertId(idToPush)),
      }))
    )
  )
);
