import r from 'rethinkdb';
import { isRecordValid } from './utils';

export default (type, id, conn) => {
  if (typeof id !== 'string') {
    throw new Error(
      `Expected '${type}' relationship to be a 'string' but got type '${typeof ids}'`
    );
  }

  const checkValidRecord = (record) => {
    const validRecord = isRecordValid(record);

    if (!validRecord) {
      throw new Error(
        `Expected a valid record of type '${type}' ` +
        `but got invalid record with id of '${id}'.`
      );
    }

    return true;
  };

  return r.table(type)
    .get(id)
    .run(conn)
    .then(checkValidRecord);
};
