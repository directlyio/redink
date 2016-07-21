import { RedinkUtilError } from 'redink-errors';

/**
 * Parses `data` and purges data fields that are not present in `schema`.
 * Replace relationships with format `{ id, archived: false }`.
 *
 * ```
 * // example user schema
 * {
 *   attributes: {
 *     name: true,
 *     email: true,
 *   },
 *   relationships: {
 *     cats: {
 *       hasMany: 'animal',
 *       inverse: 'user',
 *     },
 *     birds: {
 *       hasMany: 'animal',
 *       inverse: 'user',
 *     },
 *   }
 * }
 *
 * // Example 1: request (cascadePost)
 * {
 *   name: 'Dylan',
 *   email: 'dylanslack@gmail.com',
 *   title: 'Janitor',
 *   dogs: {
 *     old: [1, 2, 3],
 *     new: [1, 2, 4],
 *   },
 *   birds: [1, 2],
 * }
 *
 * // Example 1: output
 * {
 *   name: 'Dylan',
 *   email: 'dylanslack@gmail.com',
 *   birds: [{
 *     id: 1,
 *     archived: false,
 *   }, {
 *     id: 2,
 *     archived: false,
 *   }],
 *   meta: {
 *     archived: false,
 *   },
 * }
 *
 * // Example 2: request (cascadeUpdate)
 * {
 *   name: 'Dylan',
 *   email: 'dylanslack@gmail.com',
 *   title: 'Janitor',
 *   dogs: [1, 2, 3],
 *   birds: {
 *     old: [1, 2],
 *     new: [1, 2, 4],
 *   },
 * }
 *
 * // Example 2: output
 * {
 *   name: 'Dylan',
 *   email: 'dylanslack@gmail.com',
 *   birds: [{
 *     id: 1,
 *     archived: false,
 *   }, {
 *     id: 2,
 *     archived: false,
 *   }, {
 *     id: 4,
 *     archived: false,
 *   }],
 *   meta: {
 *     archived: false,
 *   },
 * }
 * ```
 *
 * @param  {Object} schema - Schema representing an entity's attributes and relationships.
 * @param  {Object} data - The request body object.
 * @return {Object}
 */
export default (schema, data, isUpdate = false) => {
  const { keys } = Object;
  const attributes = schema.attributes ? keys(schema.attributes) : [];
  const relationships = schema.relationships ? keys(schema.relationships) : [];
  const fields = attributes.concat(relationships);

  const sanitized = {
    meta: {
      archived: false,
    },
  };

  for (const field of fields) {
    if (data.hasOwnProperty(field)) sanitized[field] = data[field];
  }

  for (const relationship of relationships) {
    if (sanitized.hasOwnProperty(relationship)) {
      let ids;

      if (isUpdate) {
        if (!data[relationship].old || !data[relationship].new) {
          throw new RedinkUtilError(
            `Missing old and/or new fields for '${relationship}'.`
          );
        }

        ids = sanitized[relationship].new;
      } else {
        ids = sanitized[relationship];
      }

      if (
        keys(schema.relationships[relationship]).includes('hasMany') &&
        !Array.isArray(ids)
      ) {
        sanitized[relationship] = [{ id: ids, archived: false }];
      } else {
        sanitized[relationship] = Array.isArray(ids)
          ? ids.map(id => ({ id, archived: false }))
          : { id: ids, archived: false };
      }
    }
  }

  if (data.hasOwnProperty('id')) sanitized.id = data.id;
  return sanitized;
};
