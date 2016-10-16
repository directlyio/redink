import Promise from 'bluebird';
import { hasOwnProperty } from './utils';

export default class ModelArray {
  /**
   * Instantiates a ModelArray.
   *
   * ```
   * // example `models` object
   * const models = {
   *   user: {
   *     model: Model,
   *   },
   *   animal: {
   *     model: Model,
   *     alias: 'pets'
   *   },
   * };
   * ```
   *
   * @class ModelArray
   * @param {Object} models - A dictionary of models, including their optional aliases.
   */
  constructor(models) {
    this.models = models;
  }

  /**
   * Returns true if a Model with type `type` is found in the model registry.
   *
   * @private
   * @param {String} type
   * @return {Boolean}
   */
  hasModel(type) {
    return hasOwnProperty(this.models, type);
  }

  /**
   * Returns true if a Model with alias `alias` is found in the model registry.
   *
   * @private
   * @param {String} alias
   * @return {Boolean}
   */
  hasModelByAlias(alias) {
    const models = this.models;

    return Object.keys(models)
      .reduce((prev, next) => [...prev, models[next].alias], [])
      .includes(alias);
  }

  /**
   * Returns a Model instance by its alias.
   *
   * @private
   * @param {String} alias
   * @return {Model}
   */
  getModelByAlias(alias) {
    const models = this.models;
    let model;

    Object.keys(models).forEach(type => {
      if (models[type].alias === alias) {
        model = models[type].model;
        return false;
      }

      return true;
    });

    return model;
  }

  /**
   * Returns an object of values returned by each function in `actions`.
   *
   * ```js
   * model('user', 'animal:pets').map({
   *   user(model) {
   *     // model === model('user')
   *     return model.findResource('1');
   *   },
   *   pets(model) {
   *     // model === model('animal')
   *     return model.find({
   *       filter: { age: 5 },
   *     });
   *   },
   * }).then(results => {
   *   const user = results.user; // Resource
   *   const pets = results.pets; // ResourceArray
   * });
   * ```
   *
   * @async
   * @param {Object} actions
   * @returns {Promise<Object>}
   */
  map(actions) {
    const models = this.models;
    const execute = {};

    Object.keys(actions).forEach(action => {
      const fn = actions[action];

      if (typeof fn !== 'function') {
        throw new TypeError(
          'When mapping over a ModelArray, each action must be a function, instead got type ' +
          `'${typeof fn}'.`
        );
      }

      let model;

      if (this.hasModel(action)) {
        model = models[action].model;
      } else if (this.hasModelByAlias(action)) {
        model = this.getModelByAlias(action);
      }

      if (model) {
        execute[action] = fn(model);
      }
    });

    return Promise.props(execute);
  }
}
