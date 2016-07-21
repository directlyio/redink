import { forEach } from 'lodash';
import { RedinkUtilError } from 'redink-errors';

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
const types = ['hasMany', 'belongsTo', 'hasOne'];
const objectVerify = object => {
  if (Object.keys(object).length !== 2) {
    throw new RedinkUtilError('Incorrect number of properties, expecting 2.');
  }
  if (!types.includes(Object.keys(object)[0])) {
    throw new RedinkUtilError(
      'Invalid relationship type, expecting `hasMany`, `belongsTo`, or `hasOne`.'
    );
  }
};

export default (originalTable, schemas) => {
  if (!schemas[originalTable].relationships) return {};

  const rels = {};

  forEach(schemas[originalTable].relationships, (obj, key) => {
    if (obj.hasOwnProperty('embedded')) return;

    objectVerify(obj);

    const field = key;
    const original = Object.keys(obj)[0];
    const table = obj[original];
    const inverseField = obj[Object.keys(obj)[1]];

    forEach(schemas[table].relationships, subObj => {
      if (subObj.hasOwnProperty('embedded')) return;

      objectVerify(subObj);

      const inverse = Object.keys(subObj)[0];

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
