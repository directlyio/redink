/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import r from 'rethinkdb';
import addToQueue from './addToQueue';
import archiveCurrentRecord from './archiveCurrentRecord';
import createActionObject from './createActionObject';
import patchRelationships from './patchRelationships';

/**
 * Create object with deletion (and corresponding patching) instructions.
 *
 * ```js
 * // This is the general format of the returned object.
 * {
 *   archive: {
 *     listing: {         // table
 *       '1': true,       // table id
 *       ...
 *     },
 *     ...
 *   },
 *   patch: {
 *     category: {        // table
 *       '1': {           // table id
 *         listings: {    // field
 *           '1': true,   // field id
 *           ...
 *         },
 *         ...
 *       },
 *       ...
 *     },
 *     ...
 *   },
 * }
 * ```
 *
 * @param {String} originalID - ID of record of interest.
 * @param {String} originalTable - Table of interest.
 * @param {Object} schemas
 * @param {Object} conn
 * @return {Object} archiveObject
 */
export default (originalID, originalTable, schemas, conn) => {
  const buildArchiveObject = (initialQueue, initialArchiveObject) => (
    new Promise(resolve => {
      const recursivelyBuildArchiveObject = (queue, archiveObject) => {
        if (!queue.length) return resolve(archiveObject);

        const { table, id } = queue[0];
        queue.shift();

        archiveObject = archiveCurrentRecord(archiveObject, table, id);

        r.table(`${table}`).get(`${id}`).run(conn)
          .then(record => createActionObject(record, table, schemas))
          .then(actionObject => {
            queue = addToQueue(queue, actionObject);
            archiveObject = patchRelationships(archiveObject, actionObject, id, table);

            return recursivelyBuildArchiveObject(queue, archiveObject);
          });
      };

      recursivelyBuildArchiveObject(initialQueue, initialArchiveObject);
    })
  );

  const initialQueue = [{
    table: originalTable,
    id: originalID,
  }];

  const initialArchiveObject = {
    archive: {},
    patch: {},
  };

  return buildArchiveObject(initialQueue, initialArchiveObject)
    .then(completedArchiveObject => completedArchiveObject);
};
