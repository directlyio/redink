/* eslint-disable no-unused-vars */
import { db } from './dbSingleton';
import { RedinkError } from 'redink-errors';

export const create = (type, data) => db().instance().create(type, data);
export const update = (type, id, data) => db().instance().update(type, id, data);
export const archive = (type, id) => db().instance().archive(type, id);
export const find = (type, filter = {}) => db().instance().find(type, filter);
export const fetch = (type, id) => db().instance().fetch(type, id);
export const fetchRelated = (type, id, field) => db().instance().fetchRelated(type, id, field);

export default () => ({
  start({ host, name, schemas, port }) {
    return new Promise((resolve, reject) => {
      db(schemas, name, host, port).start()
        .then(resolve)
        .catch(/* istanbul ignore next */ err => (
          reject(new RedinkError(`Could not start Redink: ${err.message}`))
        ));
    });
  },

  stop() {
    return new Promise((resolve, reject) => {
      db().stop()
        .then(resolve(true))
        .catch(/* istanbul ignore next */ err => (
          reject(new RedinkError(`Could not stop Redink: ${err.message}`))
        ));
    });
  },
});
