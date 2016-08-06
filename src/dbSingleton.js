import Redink from './redink';
import { RedinkError } from 'redink-errors';

function db(schemas = {}, host = '', name = '') {
  if (db.instance) {
    return {
      instance() {
        return db.instance;
      },

      stop() {
        return db.instance.disconnect();
      },
    };
  }

  return {
    start() {
      db.instance = new Redink(schemas, host, name);
      return db.instance.connect();
    },

    instance() {
      throw new RedinkError('Error in db singleton: Redink not initialized.');
    },
  };
}

export { db };
