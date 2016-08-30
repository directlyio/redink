import r from 'rethinkdb';
import invalidSchemaType from '../errors/invalidSchemaType';

/**
 * Merges a table object with its relationships.
 *
 * ```js
 * // example table object with `pets` and `company` relationships
 * {
 *   name: 'Dylan',
 *   email: 'dylanslack@gmail.com',
 *   pets: [1, 2],
 *   company: 3,
 * }
 *
 * // is transformed into
 * {
 *   name: 'Dylan',
 *   email: 'dylanslack@gmail.com',
 *   pets: [
 *     {
 *       id: 1,
 *       type: 'dog',
 *       color: 'brown'
 *     },
 *     {
 *       id: 2,
 *       type: 'cat',
 *       color: 'black',
 *     }
 *   ],
 *   company: {
 *     id: 3,
 *     name: 'Apple',
 *     employees: [1, 2, 3],
 *   },
 * }
 *
 * This function executes the following RethinkDB query (using `users` as an example):
 * ```js
 * {
 *   r.table('users').get(1)
 *     .merge(function(user) {
 *       return r({}).merge(r.args([
 *         r.branch(user.hasFields('pets'), {
 *           pets: r.table('animals').getAll(r.args(user('pets'))).coerceTo('array'),
 *         }, {}),
 *         r.branch(user.hasFields('company'), {
 *    	     company: r.table('companies').get(user('company'))
 *         }, {})
 *       ]))
 *     })
 * }
 * ```
 *
 * @param  {Object} schemas - Schemas object.
 * @param  {String} type - A valid schema type.
 * @param  {Object} results - Un-merged table object.
 * @return {Function}
 */
export default (schemas, type) => (record) => {
  if (!schemas.hasOwnProperty(type)) {
    throw invalidSchemaType(type);
  }

  if (!('relationships' in schemas[type])) return r({});

  const { relationships } = schemas[type];
  const keys = Object.keys(relationships);

  return r({}).merge(r.args(keys.map(key => {
    const { hasMany, belongsTo, hasOne, embedded } = relationships[key];

    // don't merge embedded objects
    if (embedded) return {};

    const table = r.table(hasMany || belongsTo || hasOne);
    const hasFields = record.hasFields(key);

    const mapHasManyToIds = (rels) => rels.filter(rel => r.not(rel('archived')))('id');

    return hasMany
      ? (
          r.branch(hasFields, {
            [key]: table.getAll(r.args(mapHasManyToIds(record(key))))
              .filter(relatedRecord => r.not(relatedRecord('meta')('archived')))
              .coerceTo('array')
              .orderBy('id'),
          }, {})
        )
      : (
          r.branch(hasFields.and(r.not(record(key)('archived'))), {
            [key]: table.get(record(key)('id')),
          }, {})
        );
  })));

    // merge `hasMany`, `belongsTo`, and `hasOne` relationships
    /*
    return hasMany
      ? (
          r.branch(hasFields, {
            [key]: table.getAll(r.args(record(key)('id')))
              .filter(relatedRecord => r.not(relatedRecord('meta')('archived')))
              .coerceTo('array')
              .orderBy('id'),
          }, {})
        )
      : (
          r.branch(hasFields.and(r.not(record(key)('archived'))), {
            [key]: table.get(record(key)('id')),
          }, {})
        );
  })));
  */
};
