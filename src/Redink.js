import r from 'rethinkdb';
import Promise from 'bluebird';
import Model from './Model';
import ModelArray from './ModelArray';
import { destructureAlias, hydrateInverse } from './utils';

const DEFAULT_RETHINKDB_PORT = 28015;

export default class Redink {
  constructor({
    db = '',
    host = '',
    user = '',
    password = '',
    port = DEFAULT_RETHINKDB_PORT,
  }) {
    this.db = db;
    this.host = host;
    this.user = user;
    this.password = password;
    this.port = port;

    this.models = {};
  }

  /**
   * Connects to the RethinkDB database.
   *
   * @async
   * @return {Promise}
   */
  connect() {
    const options = {
      db: this.db,
      host: this.host,
      port: this.port,
    };

    if (this.user) options.user = this.user;
    if (this.password) options.password = this.password;

    return r.connect(options).then(conn => (this.conn = conn));
  }

  /**
   * Disconnects from the RethinkDB database.
   *
   * @async
   * @return {Promise}
   */
  disconnect() {
    if (!this.conn) {
      throw new Error('Tried disconnecting a Redink instance that was never connected.');
    }

    return this.conn.close();
  }

  /**
   * Registers Redink schemas. In other words, this completes the schema graph by hydrating inverse
   * relationships where necessary. After finishing the graph, it ensures that all proper tables are
   * created with each schema `type` as the table name.
   *
   * @param {Object} schemas - Redink schemas.
   * @return {Promise}
   *
   * @todo Create indices where necessary.
   */
  registerSchemas(schemas) {
    const { keys } = Object;
    const { conn, db } = this;
    const types = [];

    const newSchemas = { ...schemas };

    // invoke all relationship functions, i.e. all 'hasMany', 'hasOne', and 'belongsTo' functions
    keys(newSchemas).forEach(schema => {
      const { relationships } = newSchemas[schema];

      keys(relationships).forEach(field => {
        if (typeof relationships[field] !== 'function') {
          throw new TypeError(
            `Tried registering the '${schema}' schema's '${field}' relationship, but it wasn't a ` +
            'function. Please use \'hasMany\', \'belongsTo\', or \'hasOne\' from ' +
            '\'redink/schema\'.'
          );
        }

        newSchemas[schema].relationships[field] = relationships[field](field);
      });
    });

    // hydrate inverse relationships of the newly created schemas object
    keys(newSchemas).forEach(schema => {
      const { relationships } = newSchemas[schema];

      keys(relationships).forEach(field => {
        const { type } = relationships[field];
        hydrateInverse(newSchemas, type);

        if (!types.includes(type)) types.push(type);
      });
    });

    // add schema key to every schema
    keys(newSchemas).forEach(schema => {
      const { relationships } = newSchemas[schema];

      keys(relationships).forEach(field => {
        const { type } = relationships[field];

        newSchemas[schema].relationships[field].schema = newSchemas[type];
      });
    });

    this.schemas = newSchemas;

    // create missing tables
    return r.db(db).tableList().run(conn)

      // compute difference between available tables and schema types and create them
      .then(tables => {
        const missingTables = types.filter(type => !tables.includes(type));

        return Promise.all(
          missingTables.map(table => r.tableCreate(table).run(conn))
        );
      })

      // register the Models
      .then(() => {
        types.forEach(type => {
          this.models[type] = new Model(conn, type, newSchemas[type]);
        });

        return this.models;
      });
  }

  /**
   * Returns a `Model` or `ModelArray` instance with the matching type(s) from Redink's model
   * registry. Any string in `types` after a colon is interpreted as an alias.
   *
   * ```js
   * const model = app.model('user'); // user model
   * const modelArray = app.model('user', 'animal:pets'); // animal model with 'pets' alias
   * ```
   *
   * @param {...String} types
   * @returns {Model|ModelArray}
   */
  model(...types) {
    if (types.length === 0) {
      throw new TypeError(
        'A defined type is required to access a Model instance.'
      );
    }

    if (types.length === 1) {
      const model = this.models[types[0]];

      if (!model) {
        throw new Error(
          `Tried accessing a model with type '${types[0]}', but no such model was ever registered.`
        );
      }

      return model;
    }

    const models = types.reduce((prev, type) => {
      const { model, alias } = destructureAlias(type);

      return {
        ...prev,
        [type]: {
          model: this.models[model],
          alias,
        },
      };
    }, {});

    return new ModelArray(models);
  }
}
