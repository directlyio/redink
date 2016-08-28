import getRelationships from './getRelationships';
import * as types from '../constants/relationshipTypes';

/**
 * Prepares a single record for the client by purging unimportant meta information. The `record`
 * must be an object with fully hydrated relationships.
 *
 * ```
 * // example schema
 * {
 *   name: true,
 *   email: true,
 *   birds: {
 *     hasMany: 'animal'
 *     inverse: 'owner',
 *   },
 *   company: {
 *     belongsTo: 'company'
 *     inverse: 'employees',
 *   },
 * }
 *
 * // example record
 * {
 *   name: 'CJ',
 *   email: 'brewercalvinj@gmail.com',
 *   birds: [{
 *     id: 1,
 *     type: 'Blue Jay',
 *     owner: '1',
 *     archived: false,
 *   }],
 *   company: {
 *     id: 1,
 *     name: 'Directly, Inc.',
 *     employees: ['1'],
 *     archived: false,
 *   },
 * }
 *
 * // output
 * {
 *   id: '1',
 *   name: 'Dylan',
 *   email: 'dylanslack@gmail.com',
 *   birds: [{
 *     id: '1',
 *     type: 'Blue Jay',
 *     owner: '1',
 *   }],
 *   company: {
 *     id: '1',
 *     name: 'Directly, Inc.',
 *     employees: ['1'],
 *   },
 * }
 * ```
 *
 * @param  {Object} schema - All the schemas.
 * @param  {Object} schema - Schema representing an entity's attributes and relationships.
 * @param  {Object} record - The record about to be serialized.
 * @return {Object}
 */
export default (schemas, schema, record) => {
  const { keys } = Object;
  const attributes = schema.attributes || {};
  const relationships = schema.relationships || {};

  const serialized = {
    id: record.id,
  };

  const prepareRelationship = (table) => (relationship) => {
    const parsed = {};
    const blacklistedKeys = ['archived', 'meta'];
    const relationshipDescription = getRelationships(table, schemas);

    keys(relationship).forEach(key => {
      if (blacklistedKeys.includes(key)) return;

      if (keys(relationshipDescription).includes(key)) {
        if (
          relationshipDescription[key].original === types.BELONGS_TO ||
          relationshipDescription[key].original === types.HAS_ONE
        ) {
          parsed[key] = relationship[key].id;
          return;
        }

        if (relationshipDescription[key].original === types.HAS_MANY) {
          parsed[key] = relationship[key].map(rel => rel.id);
          return;
        }
      } else {
        parsed[key] = relationship[key];
      }
    });

    return parsed;
  };

  const parseRelationship = (table, relationship) => {
    /* eslint-disable no-param-reassign */
    if (relationship.hasOwnProperty('meta')) {
      delete relationship.meta;
    }

    return Array.isArray(relationship)
      ? relationship.map(prepareRelationship(table))
      : prepareRelationship(table)(relationship);
  };

  // hydrate attributes
  for (const attribute of keys(attributes)) {
    if (record.hasOwnProperty(attribute)) {
      serialized[attribute] = record[attribute];
    }
  }

  // hydrate relationships
  for (const relationship of keys(relationships)) {
    const { hasMany, belongsTo, hasOne } = relationships[relationship];
    const table = hasMany || belongsTo || hasOne;

    if (record.hasOwnProperty(relationship)) {
      serialized[relationship] = parseRelationship(table, record[relationship]);
    }
  }

  return serialized;
};
