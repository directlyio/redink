/* eslint-disable no-unused-vars */
import { db } from './dbSingleton';

export const create = (type, data) => db().instance().create(type, data);
export const update = (type, id, data) => db().instance().update(type, id, data);
export const archive = (type, id) => db().instance().delete(type, id);
export const find = (type, filter = {}) => db().instance().find(type, filter);
export const fetch = (type, id) => db().instance().fetch(type, id);

export default () => ({
  start(options) {
    const { host, name, schemas } = options;

    return new Promise((resolve, reject) => {
      db(schemas, host, name)
        .start()
        .then(resolve)
        .catch(reject);
    });
  },

  stop() {
    return new Promise((resolve, reject) => {
      db().stop()
        .then(resolve(true))
        .catch(reject);
    });
  },
});
