import archiveManyRelationship from '../queries/archiveManyRelationship';
import postRecordMany from '../queries/postRecordMany';
import postRecordOne from '../queries/postRecordOne';
import updateAppendRecord from '../queries/updateAppendRecord';
import updateArchiveRecord from '../queries/updateArchiveRecord';
import getRelationships from '../utils/getRelationships';
import * as types from '../constants/relationshipTypes';

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

  if (original === types.BELONGS_TO && inverse === types.HAS_MANY) {
    updateArray.push(archiveManyRelationship(table, inverseField, data.old, id));
    updateArray.push(postRecordMany(table, data.new, inverseField, id));
  } else if (original === types.HAS_MANY && inverse === types.HAS_MANY) {
    updateArray.push(updateAppendRecord(table, inverseField, data, id));
    updateArray.push(updateArchiveRecord(table, inverseField, data, id));
  } else if (original === types.BELONGS_TO && inverse === types.HAS_ONE) {
    updateArray.push(postRecordOne(table, data.new, inverseField, id));
  } else if (original === types.HAS_ONE && inverse === types.HAS_MANY) {
    updateArray.push(archiveManyRelationship(table, inverseField, data.old, id));
    updateArray.push(postRecordMany(table, data.new, inverseField, id));
  } else if (original === types.HAS_MANY && inverse === types.HAS_ONE) {
    throw new Error(
      'Tried updating a \'hasMany\' relationship with a \'hasOne\' inverse. Please update the ' +
      '\'hasOne\' side.'
    );
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

  const relationships = getRelationships(schemas, table);

  Object.keys(relationships).forEach(relationship => {
    const entity = relationships[relationship];

    if (
      data.hasOwnProperty(relationship) &&
      entity.inverse &&
      entity.inverseField
    ) {
      updateArray.push(...createPostArray(entity, data[relationship], id));
    }
  });

  return updateArray;
};
