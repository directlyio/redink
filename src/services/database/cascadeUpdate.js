/* eslint-disable */
import getRelationships from '../utils/getRelationships';
import { updateRecordMany, updateRecordOne } from '../utils/cascadeQueries';
import _ from 'lodash';

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
export default (record, table, connection, schemas) => {
  const { keys } = Object;
  const postArray = [];

  const relationships = getRelationships(table, schemas);

  keys(relationships).forEach(relationship => {
    if (record.hasOwnProperty(relationship)) {
      const entity = relationships[relationship];

      if (record[relationship] === null) throw new Conflict('Cannot post, entity does not exist');
      postArray.push(...createPostArray(entity, record[relationship], record.id));
    }
  });

  return postArray;
};
