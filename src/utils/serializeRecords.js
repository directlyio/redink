import serializeRecord from './serializeRecord';
import invalidSchemaType from '../errors/invalidSchemaType';

export default (schemas, type, records, count) => {
  if (!schemas.hasOwnProperty(type)) {
    throw invalidSchemaType(type);
  }

  const serialized = records.map(record => serializeRecord(schemas, type, record));
  serialized.count = count;

  return serialized;
};
