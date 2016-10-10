import r from 'rethinkdb';
import { isHasOneValid } from './utils';

export default (type, ids, field, conn) => {
  if (!Array.isArray(ids)) {
    throw new Error(
      `Expected '${type}' relationship to be an 'array' but got type '${typeof ids}'`
    );
  }

  const throwIfNotValid = (records) => {
    const validRecord = records.every(record => isHasOneValid(record, field));

    if (!validRecord) {
      throw new Error(
        `Expected a valid record of type '${type}' ` +
        'but got an invalid record.'
      );
    }
  };

  const checkValidRecords = (records) => {
    if (records.length !== ids.length) {
      throw new Error(
        `Expected to have '${ids.length}' ids ` +
        `but found '${records.length}' records of type '${type}'.`
      );
    }

    throwIfNotValid(records);
    return true;
  };

  return r.table(type)
    .getAll(r.args(ids))
    .coerceTo('array')
    .run(conn)
    .then(checkValidRecords);
};
