import invalidSchemaType from '../errors/invalidSchemaType';
import serializeRecord from './serializeRecord';
import serializeRecords from './serializeRecords';

export default (schemas, type, recordOrRecords, count) => {
  if (!schemas.hasOwnProperty(type)) {
    throw invalidSchemaType(type);
  }

  return Array.isArray(recordOrRecords)
    ? serializeRecords(schemas, type, recordOrRecords, count)
    : serializeRecord(schemas, type, recordOrRecords);
};
