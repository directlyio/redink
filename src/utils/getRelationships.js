import { forEach } from 'lodash';
import invalidSchemaType from '../errors/invalidSchemaType';

const { keys } = Object;
const allowedTypes = ['hasMany', 'hasOne', 'belongsTo'];

const throwIfInvalidRelationship = (object) => {
  if (keys(object).length !== 2) {
    throw new Error('Incorrect number of properties, expecting 2.');
  }

  if (!allowedTypes.includes(keys(object)[0])) {
    throw new Error('Invalid relationship type, expecting `hasMany`, `belongsTo`, or `hasOne`.');
  }
};

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

    throwIfInvalidRelationship(obj);

    const field = key;
    const original = keys(obj)[0];
    const table = obj[original];
    const inverseField = obj[Object.keys(obj)[1]];

    forEach(schemas[table].relationships, subObj => {
      if (subObj.hasOwnProperty('embedded')) return;

      throwIfInvalidRelationship(subObj);

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
