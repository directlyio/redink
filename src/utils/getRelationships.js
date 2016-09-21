import { forEach } from 'lodash';
import invalidSchemaType from '../errors/invalidSchemaType';

const { keys } = Object;

/**
 * Return all original and inverse relationships of a given table.
 *
 * ```js
 * // This is the general format of the returned object.
 * {
 * 	shoes: {
 * 		table: 'shoe',
 * 		original: 'hasMany',
 * 		inverse: 'belongsTo',
 * 		inverseField: 'person',
 *  },
 * }
 * ```
 *
 * @param {String} originalTable - Table of interest.
 * @param {Object} schemas - Schemas of interest.
 * @return {Object} rels
 */
export default (schemas, originalTable) => {
  if (!schemas.hasOwnProperty(originalTable)) {
    throw invalidSchemaType(originalTable);
  }

  if (!schemas[originalTable].relationships) return {};

  const rels = {};

  forEach(schemas[originalTable].relationships, (obj, key) => {
    if (obj.hasOwnProperty('embedded')) return;

    const field = key;
    const original = keys(obj)[0];
    const table = obj[original];
    const inverseField = obj[Object.keys(obj)[1]];

    forEach(schemas[table].relationships, subObj => {
      if (subObj.hasOwnProperty('embedded')) return;

      const inverse = keys(subObj)[0];

      if (originalTable === subObj[inverse]) {
        rels[field] = {
          table,
          original,
          inverse,
          inverseField,
        };
      }
    });
  });

  return rels;
};
