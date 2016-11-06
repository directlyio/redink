import r from 'rethinkdb';
import Promise from 'bluebird';
import chalk from 'chalk';
import Model from './Model';
import ModelArray from './ModelArray';
import { destructureAlias, requiresIndex } from './utils';

const DEFAULT_RETHINKDB_PORT = 28015;

export default class Redink {
  /**
   * @class Redink
   * @param {Object} [options={}]
   * @param {String} [options.db='']
   * @param {String} [options.host='']
   * @param {String} [options.user='']
   * @param {String} [options.password='']
   * @param {Object} [options.schema={}]
   * @param {Boolean} [options.verbse=false]
   * @param {Number} [options.port=28015]
   */
  constructor({
    db = '',
    host = '',
    user = '',
    password = '',
    schema = {},
    verbose = false,
    port = DEFAULT_RETHINKDB_PORT,
  }) {
    this.db = db;
    this.host = host;
    this.user = user;
    this.password = password;
    this.schema = schema;
    this.verbose = verbose;
    this.port = port;

    this.indices = {};
    this.models = {};
  }

  /**
   * Connects to the RethinkDB database, registers the schema, and configures indices.
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

    return r.connect(options)
      .then(conn => (this.conn = conn))
      .then(::this.registerSchema)
      .then(::this.configureIndices);
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
   * Registers the schema and creates a new model for each type.
   *
   * @private
   * @method registerSchema
   * @param {Object} schema
   * @return {Promise<Object>}
   */
  registerSchema() {
    const { conn, schema, db } = this;
    const names = [];

    schema.types.forEach(type => {
      const { name } = type;

      if (!names.includes(name)) names.push(name);

      type.relationships.forEach(relationship => {
        const {
          relation,
          name: relatedName,
          inverse: {
            relation: inverseRelation,
            field: inverseField,
          },
        } = relationship;

        if (requiresIndex(relation, inverseRelation)) {
          if (!this.indices[relatedName]) this.indices[relatedName] = {};
          this.indices[relatedName][inverseField] = true;
        }
      });
    });

    // ensure that the schema will never be mutated
    this.schema = Object.freeze(schema);

    // create missing tables
    return r.db(db).tableList().run(conn)

      // compute difference between available tables and schema types and create them
      .then(tables => {
        const missingTables = names.filter(name => !tables.includes(name));

        return Promise.props(
          missingTables.reduce((prev, next) => ({
            [next]: r.tableCreate(next).run(conn),
          }), {})
        );
      })

      // register the Models
      .then(() => {
        names.forEach(name => {
          this.models[name] = new Model(conn, this.schema.types[name]);
        });
      });
  }

  /**
   * Determines which indices are missing on `table` and creates them.
   *
   * @private
   * @method reconcileMissingIndices
   * @param {String} table - The table to reconcile missing indices on.
   * @return {Promise<Array>}
   */
  reconcileMissingIndices(table) {
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

        if (verbose && missingIndices.length) {
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
        [next]: this.reconcileMissingIndices(next),
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
   * const model = model('user'); // user model
   * const modelArray = model('user', 'animal:pets'); // animal model with 'pets' alias
   * ```
   *
   * @method model
   * @param {...String} types
   * @returns {(Model|ModelArray)}
   */
  model(...names) {
    if (names.length === 0) {
      throw new TypeError(
        'A defined type is required to access a Model instance.'
      );
    }

    if (names.length === 1) {
      const model = this.models[names[0]];

      if (!model) {
        throw new Error(
          `Tried accessing a model with type '${names[0]}', but no such model was ever registered.`
        );
      }

      return model;
    }

    const models = names.reduce((prev, type) => {
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
