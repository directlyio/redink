import { getRelationships } from './';

 /**
  * Return an object that contains a table's relationship information (object) and fields (array).
  *
  * @param {String} table - Table of interest pulled from the archival queue.
  * @param {Object} schemas
  * @return {Object}
  */
const getRelationshipFields = (table, schemas) => {
  const relationshipObject = getRelationships(table, schemas);
  const relationshipFields = Object.keys(relationshipObject);

  return {
    relationshipObject,
    relationshipFields,
  };
};

/**
 * Determine if a particular relationship field of a table should be archived or patched.
 *
 * @param {Object} fieldObject - A relationship field pulled from the `relationshipObject`.
 * @return {String}
 */
const archiveOrPatch = fieldObject => (
  (fieldObject.original === 'hasOne' && fieldObject.inverse === 'belongsTo') ||
  (fieldObject.original === 'hasMany' && fieldObject.inverse === 'belongsTo')
  ? 'archive'
  : 'patch'
);

/**
 * Create an `actionObject` to indicate how the `archiveObject` and `queue` should be modified.
 *
 * @param {Object} record - Record retrieved from the database.
 * @param {String} currentTable - Table of interest pulled from the archival queue.
 * @param {Object} schemas
 * @return {Object} actionObject
 */
export default (record, currentTable, schemas) => {
  const { relationshipObject, relationshipFields } = getRelationshipFields(currentTable, schemas);
  const actionObject = {};

  relationshipFields.forEach(field => {
    if (!record[field]) return;

    const fieldObject = relationshipObject[field];
    const action = archiveOrPatch(fieldObject);
    const { table, inverseField } = fieldObject;
    const ids = Array.isArray(record[field])
      ? record[field].map(object => object.id)
      : record[field].id;

    actionObject[field] = {
      action,
      table,
      inverseField,
      ids,
    };
  });

  return actionObject;
};
