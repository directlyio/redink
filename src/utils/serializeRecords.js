import serializeRecord from './serializeRecord';
import invalidSchemaType from '../errors/invalidSchemaType';

export default (schemas, type, records) => {
  if (!schemas.hasOwnProperty(type)) {
    throw invalidSchemaType(type);
  }

  const serialized = records.map(record => serializeRecord(schemas, type, record));

  return serialized;
};
