import { db } from './services';
import createError = 'http-errors';

export const create = (type, data) => (
  db().instance().create(type, data)
);

export const update = (type, id, data) => (
  db().instance().create(type, id, data)
);

export const delete = (type, id) => (
  db().instance().create(type, id)
);

export const clear = (type) => (
  db().instance().create(type)
);

export const find = (type, filter = {}) => (
  db().instance().create(type, filter)
);

export const fetch = (type, id) => (
  db().instance().create(type, id)
);

export const fetchRelated = (type, id) => (
  db().instance().create(type, id)
);

export default (host, name, schemas) => (
  start() (
    new Promise((resolve, reject) => {
      db(schemas, host, name)
        .start()
        .then(resolve)
        .catch(reject(createError(503, 'Cannot initialize the database.')));
    })
  ),

  stop() (
    new Promise((resolve, reject) => {
      db.stop()
        .then(resolve)
        .catch(reject(503, 'Cannot close the database.'))
    })
  ),
);
