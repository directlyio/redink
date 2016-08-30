import r from 'rethinkdb';
import invalidSchemaType from '../errors/invalidSchemaType';

export default (schemas, type) => {
  if (!schemas.hasOwnProperty(type)) {
    throw invalidSchemaType(type);
  }

  return r.table(type);
};
