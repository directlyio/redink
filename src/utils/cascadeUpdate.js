import getRelationships from '../utils/getRelationships';
import { archiveManyRelationship,
         postRecordMany,
         postRecordOne,
         updateAppendRecord,
         updateArchiveRecord } from '../utils/cascadeQueries';

/**
 * Create an array of RethinkDB queries based on the relationship and its inverse.
 * Return the array to @see cascadeUpdate and push to updateArray.
 *
 * @param  {Object} entity - Relationship information returned from @see getRelationships.
 * @param  {Object} data - Object containing old and new data.
 * @param  {String} id - ID of the record that is getting updated.
 * @return {Array} Array of RethinkDB queries.
 */
const createPostArray = (entity, data, id) => {
  const { table, inverseField, original, inverse } = entity;
  const updateArray = [];

  if (original === 'belongsTo' && inverse === 'hasMany') {
    updateArray.push(archiveManyRelationship(table, inverseField, data.old, id));
    updateArray.push(postRecordMany(table, data.new, inverseField, id));
  } else if (original === 'hasMany' && inverse === 'hasMany') {
    updateArray.push(updateAppendRecord(table, inverseField, data, id));
    updateArray.push(updateArchiveRecord(table, inverseField, data, id));
  } else if (original === 'belongsTo' && inverse === 'hasOne') {
    updateArray.push(postRecordOne(table, data.new, inverseField, id));
  }

  return updateArray;
};

/**
 * Update a relationship of a record that was just patched.
 *
 * ```
 * // example call with params
 * cascadePost(record, 'listing', conn, schemas);
 * ```
 *
 * @param {Object} record - Record that was just created.
 * @param {String} table - Table name of record.
 * @param {Object} connection - Connection to rethink database.
 * @param {Object} schemas - Schemas to determine relationships.
 * @return {Array} Array of RethinkDB queries.
 */
export default (table, id, data, schemas) => {
  const updateArray = [];

  const relationships = getRelationships(table, schemas);

  Object.keys(relationships).forEach(relationship => {
    if (data.hasOwnProperty(relationship)) {
      const entity = relationships[relationship];

      updateArray.push(...createPostArray(entity, data[relationship], id));
    }
  });

  return updateArray;
};
