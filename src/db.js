import Database from './database';

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
      db.instance = new Database(schemas, { host, name });
      return db.instance.connect();
    },
  };
}

export { db };
