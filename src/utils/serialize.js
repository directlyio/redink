import invalidSchemaType from '../errors/invalidSchemaType';
import serializeRecord from './serializeRecord';
import serializeRecords from './serializeRecords';

export default (schemas, type, recordOrRecords) => {
  if (!schemas.hasOwnProperty(type)) {
    throw invalidSchemaType(type);
  }

  return Array.isArray(recordOrRecords)
    ? serializeRecords(schemas, type, recordOrRecords)
    : serializeRecord(schemas, type, recordOrRecords);
};
