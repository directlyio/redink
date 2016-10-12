import Resource from './Resource';

export default class ResourceArray {
  /**
   * @class ResourceArray
   * @param {Object} conn
   * @param {Object} schema
   * @param {Array} records
   */
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
   * @method first
   * @return {Resource}
   */
  first() {
    return this.resources[0];
  }

  /**
   * Returns the last resource.
   *
   * @method last
   * @return {Resource}
   */
  last() {
    return this.resources[this.resources.length - 1];
  }

  /**
   * Maps over the resources and invokes `fn` with each individual `resource` as the argument.
   *
   * ```
   * model('user').findRelated('1', 'pets').then(pets => {
   *   return pets.map(pet => pet.update({ age: pet.attribute('age') + 1 }));
   * }).then(newPets => {
   *   // ResourceArray
   * });
   * ```
   *
   * @method map
   * @param {Function} fn
   * @return {Array}
   */
  map(fn) {
    return this.resources.map(fn);
  }

  /**
   * Invokes `fn` with each individual `resource` as the argument.
   *
   * ```
   * model('user').findRelated('1', 'pets').then(pets => {
   *   return pets.each(pet => pet.archive());
   * });
   * ```
   *
   * @method fn
   * @param {Function} fn
   */
  forEach(fn) {
    this.resources.forEach(fn);
  }

  /**
   * Returns the number of resources.
   *
   * @method size
   * @return {Number}
   */
  size() {
    return this.resources.length;
  }

  /**
   * Returns true if the predicate function returns true for every resource.
   *
   * ```
   * model('user').findRelated('1', 'pets').then(pets => {
   *   return pets.every(pet => pet.attribute('species') === 'Dog');
   * }).then(areAllPetsDogs => {
   *   // Boolean
   * });
   * ```
   *
   * @method every
   * @param {Function} fn
   * @return {Boolean}
   */
  every(fn) {
    return this.resoures.every(fn);
  }

  /**
   * Returns true if the predicate function returns true for any resource.
   *
   * @method some
   * @param {Function} fn
   * @return {Boolean}
   */
  some(fn) {
    return this.resources.some(fn);
  }

  /**
   * Reduces this resource array.
   *
   * @param {Function} fn
   * @param {*} initialValue
   * @return {*}
   */
  reduce(fn, initialValue) {
    return this.resources.reduce(fn, initialValue);
  }

  /**
   * Returns an array of plan `Resource` objects.
   *
   * @method toArray
   * @return {Array}
   */
  toArray() {
    return this.resources.map(resource => resource.toObject());
  }
}
