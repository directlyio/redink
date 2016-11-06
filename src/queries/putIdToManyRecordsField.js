import r from 'rethinkdb';
import { convertIdToResourcePointer } from './utils';

export default (name, ids, field, idToPut) => (
  r.table(name).getAll(r.args(ids)).update({
    [field]: convertIdToResourcePointer(idToPut),
  })
);
