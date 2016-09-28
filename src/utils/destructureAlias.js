/**
 * Destructures a type string that may have an alias.
 *
 * ```
 * const destructureAlias('user') === {
 *   model: 'user',
 *   alias: undefined,
 * };
 *
 * const destructureAlias('animal:pets') === {
 *   model: 'animal',
 *   alias: 'pets',
 * };
 * ```
 *
 * @param {String} type - A model type with an optional alias, delimited by a colon.
 * @return {Object}
 */
export default (type) => {
  const modelAndAlias = type.split(':');

  return {
    model: modelAndAlias[0],
    alias: modelAndAlias[1],
  };
};
