/* eslint-disable no-unused-vars */
import { db } from './db';

export const create = (type, data) => db().instance().create;
export const update = (type, id, data) => db().instance().update;
export const archive = (type, id) => db().instance().delete;
export const find = (type, filter = {}) => db().instance().find;
export const fetch = (type, id) => db().instance().fetch;
export const fetchRelated = (type, id) => db().instance().fetchRelated;

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
      console.log('got to start');
      db().stop()
        .then(resolve(true))
        .catch(reject);
    });
  },
});
