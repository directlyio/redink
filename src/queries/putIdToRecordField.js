import r from 'rethinkdb';
import { convertIdToResourcePointer } from './utils';

export default (name, id, field, idToPut) => (
  r.table(name).get(id).update({
    [field]: convertIdToResourcePointer(idToPut),
  })
);
