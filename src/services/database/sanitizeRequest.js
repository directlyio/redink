/**
 * Parses `data` and purges data fields that are not present in `schema`.
 * Replace relationships with format `{ id, archived: false }`.
 *
 * ```
 * // example user schema
 * {
 *   name: true,
 *   email: true,
 *   cats: {
 *     hasMany: 'animal',
 *   },
 *   birds: {
 *     hasMany: 'animal'
 *   },
 * }
 *
 * // example request
 * {
 *   name: 'Dylan',
 *   email: 'dylanslack@gmail.com',
 *   title: 'Janitor',
 *   dogs: [1, 2, 3],
 *   birds: [1, 2],
 * }
 *
 * // output
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
 * }
 * ```
 *
 * @param  {Object} schema - Schema representing an entity's attributes and relationships.
 * @param  {Object} data - The request body object.
 * @return {Object}
 */
export default (schema, data) => {
  const { keys } = Object;
  const attributes = schema.attributes ? keys(schema.attributes) : [];
  const relationships = !schema.relationships ? [] : keys(schema.relationships);
  const fields = attributes.concat(relationships);

  const sanitized = {
    meta: {
      archived: false,
    },
  };

  for (const field of fields) {
    if (data.hasOwnProperty(field)) {
      sanitized[field] = data[field];
    }
  }

  for (const relationship of relationships) {
    if (sanitized.hasOwnProperty(relationship)) {
      const ids = sanitized[relationship];

      sanitized[relationship] = Array.isArray(ids)
        ? ids.map(id => ({ id, archived: false }))
        : { id: ids, archived: false };
    }
  }

  if (data.hasOwnProperty('id')) sanitized.id = data.id;

  return sanitized;
};
