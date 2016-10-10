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
   * Connects to the RethinkDB database, registers the schemas, and configures indices.
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

    const registerSchemas = () => this.registerSchemas();
    const configureIndices = () => this.configureIndices();

    return r.connect(options)
      .then(conn => (this.conn = conn))
      .then(registerSchemas)
      .then(configureIndices);
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
   */
  registerSchemas() {
    const { conn, schemas, db, visitSchemas } = this;
    const types = [];

    const newSchemas = { ...schemas };

    visitSchemas(newSchemas, {
      enterSchema: ({ type, schema }) => {
        if (!types.includes(schema)) types.push(type);
      },
      enterRelationship: ({ type, field, relationship }) => {
        if (typeof relationship !== 'function') {
          throw new TypeError(
            `Tried registering the '${type}' schema's '${field}' relationship, but it wasn't a ` +
            'function. Please use \'hasMany\', \'belongsTo\', or \'hasOne\' from ' +
            '\'redink/schema\'.'
          );
        }

        newSchemas[type].relationships[field] = relationship(field);
      },
    });

    visitSchemas(newSchemas, {
      enterRelationship: ({ relationship: { type } }) => {
        hydrateInverse(newSchemas, type);
      },
    });

    visitSchemas(newSchemas, {
      enterRelationship: ({ type, field, relationship }) => {
        const {
          relation,
          type: relatedType,
          inverse: {
            relation: inverseRelation,
            field: inverseField,
          },
        } = relationship;

        newSchemas[type].relationships[field].schema = newSchemas[relatedType];

        if (requiresIndex(relation, inverseRelation)) {
          if (!this.indices[relatedType]) this.indices[relatedType] = {};
          this.indices[relatedType][inverseField] = true;
        }
      },
    });

    this.schemas = Object.freeze(newSchemas);

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
      });
  }

  /**
   * Walks through each schema, and calls `actions.enterSchema` upon entering each schema and calls
   * `actions.enterRelationship` upon entering each relationship of that schema.
   *
   * @param {Object} schemas
   * @param {Object} [actions={}]
   * @param {Function} [actions.enterSchema]
   * @param {Function} [actions.enterRelationship]
   */
  visitSchemas(schemas, actions = {}) {
    const { keys } = Object;

    keys(schemas).forEach(type => {
      const schema = schemas[type];

      if (typeof actions.enterSchema === 'function') {
        actions.enterSchema({ type, schema });
      }

      keys(schema.relationships).forEach(field => {
        if (typeof actions.enterRelationship === 'function') {
          actions.enterRelationship({
            relationship: schema.relationships[field],
            type,
            schema,
            field,
          });
        }
      });
    });
  }

  /**
   * Determines which indices are missing on `table` and creates them.
   *
   * @private
   * @method reconcileMissingTableIndices
   * @param {String} table - The table to reconcile missing indices on.
   * @return {Promise<Array>}
   */
  reconcileMissingTableIndices(table) {
    const { conn, indices, verbose } = this;

    if (!indices[table]) {
      throw new Error(
        `Tried to reconcile the missing indices on table '${table}', but '${table}' was not ` +
        'in the \'indices\' registry.'
      );
    }

    const fieldsToIndex = Object.keys(indices[table]);

    return r.table(table).indexList().run(conn)

      // determine which indices are missing and create them
      .then(existingIndices => {
        const missingIndices = fieldsToIndex.filter(
          field => !existingIndices.includes(field)
        );

        if (verbose) {
          const formattedMissingIndices = missingIndices.toString().split(',').join(', ');

          // eslint-disable-next-line
          console.log(
            `Configuring the ${chalk.blue(formattedMissingIndices)} ` +
            `${formattedMissingIndices.length > 1 ? 'index' : 'indices'} on table ` +
            `${chalk.blue(table)}...`
          );
        }

        return Promise.all(
          missingIndices.map(index =>
            r.table(table).indexCreate(index, r.row(index)('id')).run(conn)
          )
        );
      })

      // wait for all the indices on `table` to finish creating
      .then(() => r.table(table).indexWait().run(conn));
  }

  /**
   * Configures indices where necessary.
   *
   * @async
   * @private
   * @return {Promise}
   *
   * @todo Expand on this documentation.
   */
  configureIndices() {
    const { indices, verbose } = this;
    const { keys } = Object;

    return Promise.props(
      keys(indices).reduce((prev, next) => ({
        ...prev,
        [next]: this.reconcileMissingTableIndices(next),
      }), {})
    ).then(reconciledTables => {
      if (verbose) {
        keys(reconciledTables).forEach(table => {
          reconciledTables[table].forEach(index => {
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
