/**
 * Parses `data` and purges data fields that are not present in `schema`.
 * Replace relationships with format `{ id, archived: false }`.
 *
 * ```
 * // example user schema
 * {
 *   name: true,
 *   email: true,
 *   birds: {
 *     hasMany: 'animal'
 *   },
 *   company: {
 *     belongsTo: 'company'
 *   },
 * }
 *
 * // example body
 * {
 *   name: 'CJ',
 *   email: 'brewercalvinj@gmail.com',
 *   birds: [{
 *     id: 1,
 *     archived: false,
 *   }, {
 *     id: 2,
 *     archived: false,
 *   }],
 *   company: {
 *     id: 1,
 *     archived: false,
 *   },
 * }
 *
 * // output
 * {
 *   name: 'Dylan',
 *   email: 'dylanslack@gmail.com',
 *   birds: [1,2],
 *   company: 1,
 * }
 * ```
 *
 * @param  {Object} schema - Schema representing an entity's attributes and relationships.
 * @param  {Object} data - The body object.
 * @return {Object}
 */
export default (schema, data) => {
  const { keys } = Object;
  const attributes = schema.attributes ? keys(schema.attributes) : [];
  const relationships = !schema.relationships ? [] : keys(schema.relationships);
  const fields = attributes.concat(relationships);

  const serialized = {
    id: data.id,
  };

  for (const field of fields) {
    if (data.hasOwnProperty(field)) {
      serialized[field] = data[field];
    }
  }

  for (const relationship of relationships) {
    if (serialized.hasOwnProperty(relationship)) {
      const redinkObject = serialized[relationship];
      if (redinkObject.hasOwnProperty('archived')) delete redinkObject.archived;
      serialized[relationship] = redinkObject;
    }
  }

  return serialized;
};
