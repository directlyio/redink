import r from 'rethinkdb';
import { convertIdToResourcePointer } from './utils';

export default (type, id, field, idToPut) => (
  r.table(type).get(id).update({
    [field]: convertIdToResourcePointer(idToPut),
  })
);
