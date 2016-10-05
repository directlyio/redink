/* eslint-disable no-unused-vars */
import { db } from './dbSingleton';

/* istanbul ignore next */
export const create = (type, data) => db().instance().create(type, data);
/* istanbul ignore next */
export const update = (type, id, data) => db().instance().update(type, id, data);
/* istanbul ignore next */
export const archive = (type, id) => db().instance().archive(type, id);

/* istanbul ignore next */
export const find = (type, filter = {}, options = {}) =>
  db().instance().find(type, filter, options);
/* istanbul ignore next */
export const fetch = (type, id, options = {}) =>
  db().instance().fetch(type, id, options);
/* istanbul ignore next */
export const fetchRelated = (type, id, field, options = {}) =>
  db().instance().fetchRelated(type, id, field, options);

export default () => ({
  start({ host, name, schemas, port, user, password }) {
    return db(schemas, name, host, user, password, port).start();
  },

  stop() {
    return db().stop();
  },
});
