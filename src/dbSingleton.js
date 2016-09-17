import Redink from './Redink';

export function db(schemas = {}, name = '', host = '', port = 28015) {
  if (db.instance) {
    return {
      instance() {
        if (process.env.REDINK_DEBUG) {
          console.log( // eslint-disable-line
            `Accessing Redink\'s singleton, db: ${db.instance.name}, host: ${db.instance.host}, ` +
            `port: ${db.instance.port}.`
          );
        }

        return db.instance;
      },

      stop() {
        return db.instance.disconnect();
      },
    };
  }

  return {
    start() {
      db.instance = new Redink(schemas, name, host, port);
      return db.instance.connect();
    },

    instance() {
      throw new Error(
        'Tried invoking Redink\'s singleton instance without first starting it. This could be ' +
        'because you tried importing `create`, `fetch`, etc, from Redink without creating a ' +
        'connection. Please try running redink().start() before invoking any of Redink\'s methods.'
      );
    },
  };
}
