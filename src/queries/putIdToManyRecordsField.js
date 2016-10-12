import r from 'rethinkdb';
import { convertIdToResourcePointer } from './utils';

export default (type, ids, field, idToPut) => (
  r.table(type).getAll(r.args(ids)).update({
    [field]: convertIdToResourcePointer(idToPut),
  })
);
