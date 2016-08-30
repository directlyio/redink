import archiveManyRelationship from '../queries/archiveManyRelationship';
import archiveSingleRelationship from '../queries/archiveSingleRelationship';
import getRelationships from './getRelationships';

/**
 * Traverse the patch object from `getArchiveObject`.
 * Loops through patch and sets `archived` to true for each ID in the entity.
 * If the relationship is `hasMany` it archives with {@link archiveManyRelationship}.
 * If the relationship is `belongsTo` or `hasOne` it archives with {@link archiveSingleRelationship}
 *
 * ```
 * // example patch object
 * patch: {
 *   enterprise: {
 *     100: {
 *       listings: {
 *         1111: true,
 *         2222: true,
 *       },
 *       ads: {
 *         11110: true,
 *         22220: true,
 *       },
 *     },
 *   },
 *   ...
 * }
 *
 * // returns array of RethinkDB queries
 * [
 *   r.table('enterprise').get('100').update(...),
 *   r.table('listing').get('1111').update(...),
 *   ...
 * ]
 * ```
 *
 * @param  {Object} patch - archiveObject.patch
 * @param  {Object} schemas - Schemas passed in from db instance.
 * @return {Array} - Array of RethinkDB queries.
 */
export default (patch, schemas) => {
  const { keys } = Object;
  const archiveArray = [];

  keys(patch).forEach(table => {
    const relationships = getRelationships(schemas, table);
    const lookup = patch[table];

    keys(lookup).forEach(id =>
      keys(lookup[id]).forEach(field =>
        keys(lookup[id][field]).forEach(fieldId => (
          archiveArray.push((
            relationships[field].original === 'hasMany'
              ? archiveManyRelationship(table, field, id, fieldId)
              : archiveSingleRelationship(table, field, id, fieldId)
          ))
        ))
      )
    );
  });

  return archiveArray;
};
