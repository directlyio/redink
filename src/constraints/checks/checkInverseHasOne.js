import r from 'rethinkdb';
import { isHasOneValid } from '../utils';

export default (type, id, field, conn) => {
  if (typeof id !== 'string') {
    throw new Error(
      `Expected '${type}' relationship to be a 'string' but got type '${typeof ids}'`
    );
  }

  const checkValidRecord = (record) => {
    const validRecord = isHasOneValid(record, field);

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
