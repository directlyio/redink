/* eslint-disable no-underscore-dangle */
import r from 'rethinkdb';

export default (type, id, field, conn) => {
  if (typeof id !== 'string') {
    throw new Error(
      `Expected '${type}' relationship to be a 'string' but got type '${typeof ids}'`
    );
  }

  const isValid = (record) => {
    const fieldToCheck = record[field];

    if (record.meta._archived) return false;
    if (!fieldToCheck) return true;
    if (fieldToCheck._archived) return true;
    if (fieldToCheck._related) return true;

    return false;
  };

  const handleRecord = (record) => {
    const validRecord = isValid(record);

    if (!validRecord) {
      throw new Error(
        `Expected a valid record of type '${type}' ` +
        `but got invalid record with id of '${record.id}'`
      );
    }

    return true;
  };

  return r.table(type)
    .get(id)
    .run(conn)
    .then(handleRecord);
};
