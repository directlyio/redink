/* eslint-disable no-underscore-dangle */
import r from 'rethinkdb';
import { forEach } from 'lodash';

export default (type, ids, field, conn) => {
  if (!Array.isArray(ids)) {
    throw new Error(
      `Expected '${type}' to be an 'array' but got type '${typeof ids}'`
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

  const handleRecords = (records) => {
    if (records.length !== ids.length) {
      throw new Error(
        `Expected to have '${ids.length}' ids ` +
        `but found '${records.length}' records of type '${type}'`
      );
    }

    forEach(records, (record) => {
      const validRecord = isValid(record);

      if (!validRecord) {
        throw new Error(
          `Expected a valid record of type '${type}' ` +
          `but got invalid record with id of '${record.id}'`
        );
      }
    });

    return true;
  };

  return r.table(type)
    .getAll(r.args(ids))
    .run(conn)
    .then(handleRecords);
};
