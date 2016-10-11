import r from 'rethinkdb';
import { convertId } from './utils';

export default (type, ids, field, idToPut) => (
  r.table(type).getAll(r.args(ids)).update({
    [field]: convertId(idToPut),
  })
);
