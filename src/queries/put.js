import r from 'rethinkdb';
import { convertId } from './utils';

export default (type, id, field, idToPut) => (
  r.table(type).get(id).update({
    [field]: convertId(idToPut),
  })
);
