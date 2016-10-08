import r from 'rethinkdb';
import Promise from 'bluebird';
import chalk from 'chalk';
import Model from './Model';
import ModelArray from './ModelArray';
import { destructureAlias, hydrateInverse, requiresIndex } from './utils';

const DEFAULT_RETHINKDB_PORT = 28015;

export default class Redink {
  /**
   * @class Redink
   * @param {Object} [options={}]
   * @param {String} [options.db='']
   * @param {String} [options.host='']
   * @param {String} [options.user='']
   * @param {String} [options.password='']
   * @param {Object} [options.schemas={}]
   * @param {Boolean} [options.verbse=false]
   * @param {Number} [options.port=28015]
   */
  constructor({
    db = '',
    host = '',
    user = '',
    password = '',
    schemas = {},
    verbose = false,
    port = DEFAULT_RETHINKDB_PORT,
  }) {
    this.db = db;
    this.host = host;
    this.user = user;
    this.password = password;
    this.schemas = schemas;
    this.verbose = verbose;
    this.port = port;

    this.indices = {};
    this.models = {};
  }

  /**
   * Connects to the RethinkDB database and registers the schemas.
   *
   * @async
   * @method connect
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

    return r.connect(options).then(conn => {
      this.conn = conn;
      return this.registerSchemas(this.schemas);
    });
  }

  /**
   * Disconnects from the RethinkDB database.
   *
   * @async
   * @method disconnect
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
   *
   * @private
   * @method registerSchemas
   * @param {Object} schemas - Redink schemas.
   * @return {Promise<Object>}
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

      if (!types.includes(schema)) types.push(schema);

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
      });
    });

    // add schema key to every schema and build the indices object
    keys(newSchemas).forEach(schema => {
      const { relationships } = newSchemas[schema];

      keys(relationships).forEach(field => {
        const { type } = relationships[field];

        const {
          relation,
          inverse: {
            relation: inverseRelation,
            field: inverseField,
          },
        } = newSchemas[schema].relationship(field);

        newSchemas[schema].relationships[field].schema = newSchemas[type];

        if (requiresIndex(relation, inverseRelation)) {
          if (!this.indices[type]) this.indices[type] = {};

          this.indices[type][inverseField] = true;
        }
      });
    });

    this.schemas = newSchemas;

    // create missing tables
    return r.db(db).tableList().run(conn)

      // compute difference between available tables and schema types and create them
      .then(tables => {
        const missingTables = types.filter(type => !tables.includes(type));

        return Promise.props(
          missingTables.reduce((prev, next) => ({
            [next]: r.tableCreate(next).run(conn),
          }), {})
        );
      })

      // register the Models
      .then(() => {
        types.forEach(type => {
          this.models[type] = new Model(conn, type, newSchemas[type]);
        });

        return this.configureIndices();
      });
  }

  /**
   * Configures indices where necessary.
   *
   * @async
   * @private
   * @return {Promise}
   *
   * @todo Expand on this documentation.
   * @todo Add verbose check for logging.
   * @todo Add check for existing indices
   */
  configureIndices() {
    const { conn, indices, verbose } = this;
    const { keys } = Object;

    return Promise.props(
      keys(indices).reduce((prev, next) => {
        const fields = keys(indices[next]);

        return {
          ...prev,
          [next]: r.table(next).indexList().run(conn)
            .then(existingIndices => {
              const missingIndices = fields.filter(field => !existingIndices.includes(field));

              if (verbose) {
                const formattedMissingIndices = missingIndices.toString().split(',').join(', ');
                // eslint-disable-next-line
                console.log(
                  `Configuring the ${chalk.blue(formattedMissingIndices)} ` +
                  `${formattedMissingIndices.length > 1 ? 'index' : 'indices'} on table ` +
                  `${chalk.blue(next)}...`
                );
              }

              return Promise.all(
                missingIndices.map(index =>
                  r.table(next).indexCreate(index, r.row(index)('id')).run(conn)
                )
              );
            }),
        };
      }, {})
    ).then(tables => Promise.props(
      keys(tables).reduce((prev, next) => ({
        ...prev,
        [next]: r.table(next).indexWait().run(conn),
      }), {})
    )).then(tables => {
      if (verbose) {
        Object.keys(tables).forEach(table => {
          tables[table].forEach(index => {
            // eslint-disable-next-line
            console.log(
              `Index ${chalk.blue(index.index)} on table ${chalk.blue(table)} status: ` +
              `${index.ready ? chalk.green('ready') : chalk.red('error')}.`
            );
          });
        });
      }
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
   * @method model
   * @param {...String} types
   * @returns {(Model|ModelArray)}
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
