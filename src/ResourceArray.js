import Promise from 'bluebird';
import Resource from './Resource';

export default class ResourceArray {
  constructor(conn, schema, records) {
    if (!conn) {
      throw new TypeError(
        'A valid RethinkDB connection is required to instantiate a ResourceArray.'
      );
    }

    if (!schema) {
      throw new TypeError('A valid schema is required to instantiate a ResourceArray.');
    }

    if (!records) {
      throw new TypeError('The \'records\' array is required to instantiate a ResourceArray.');
    }

    if (!Array.isArray(records)) {
      throw new TypeError(
        `The 'records' argument must be an Array, instead had type '${typeof records}'.`
      );
    }

    this.resources = records.map(record => new Resource(conn, schema, record));
  }

  /**
   * Returns the first resource.
   *
   * @return {Resource}
   */
  first() {
    return this.resources[0];
  }

  /**
   * Returns the last resource.
   *
   * @return {Resource}
   */
  last() {
    return this.resources[this.resources.length - 1];
  }

  /**
   * Maps over the resources and invokes `fn` with each individual `resource` as the argument.
   *
   * ```
   * app.model('user').findRelated('1', 'pets').then(pets => {
   *   return pets.map(pet => pet.update({ age: pet.attribute('age') + 1 }));
   * }).then(newPets => {
   *   // ResourceArray
   * });
   * ```
   *
   * @param {Function} fn
   * @return {Promise}
   */
  map(fn) {
    return Promise.all(this.resources.map(fn));
  }

  /**
   * Invokes `fn` with each individual `resource` as the argument.
   *
   * ```
   * app.model('user').findRelated('1', 'pets').then(pets => {
   *   return pets.each(pet => pet.archive());
   * }).then(newPets => {
   *   // ResourceArray
   * });
   * ```
   *
   * @param {Function} fn
   * @return {Promise}
   */
  each(fn) {
    return Promise.all(this.resources.forEach(fn));
  }

  /**
   * Returns an array of plan `Resource` objects.
   *
   * @return {Array}
   */
  toArray() {
    return this.resources.map(resource => resource.toObject());
  }
}
