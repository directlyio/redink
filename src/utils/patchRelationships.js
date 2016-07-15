/* eslint-disable no-param-reassign */

/**
 * Helper for `patchRelationships` used to indicate how to patch the current archivable record "up"
 * (i.e. from its related records up to the current record).
 *
 * @param {Object} object - Used to indicate what and how to "patch up".
 * @return {Object} archiveObject
 */
const patchHelper = object => {
  const { currentTable, currentID, id, field, table, inverseField, archiveObject } = object;

  archiveObject.patch[currentTable][currentID][field][id] = true;

  if (!archiveObject.patch[table][id]) {
    archiveObject.patch[table][id] = {
      [inverseField]: {
        [currentID]: true,
      },
    };
  } else if (!archiveObject.patch[table][id][inverseField]) {
    archiveObject.patch[table][id][inverseField] = { [currentID]: true };
  } else {
    archiveObject.patch[table][id][inverseField][currentID] = true;
  }

  return archiveObject;
};

 /**
  * Helper for `getArchiveObject` used to indicate how to patch the current archivable record "down"
  * (i.e. from the record down to its fields) and "up" (i.e. from the related records up to the
  * current record).
  *
  * @param {Object} archiveObject - The object to be updated with patching instructions.
  * @param {Object} actionObject - Used to pull out a related field's table, inverse field, and ids.
  * @param {String} currentID - The current archivable record's ID.
  * @param {String} currentTable - The current archivable record's table.
  * @return {Object} archiveObject
  */
const patchRelationships = (archiveObject, actionObject, currentID, currentTable) => {
  if (!archiveObject.patch[currentTable]) {
    archiveObject.patch[currentTable] = { [currentID]: {} };
  } else {
    archiveObject.patch[currentTable][currentID] = {};
  }

  Object.keys(actionObject).forEach(field => {
    const { table, inverseField, ids } = actionObject[field];
    const obj = { currentTable, currentID, field, table, inverseField, archiveObject };

    if (!archiveObject.patch[currentTable][currentID][field]) {
      archiveObject.patch[currentTable][currentID][field] = {};
    }

    if (!archiveObject.patch[table]) archiveObject.patch[table] = {};

    if (Array.isArray(ids)) {
      ids.forEach(id => {
        obj.id = id;
        patchHelper(obj);
      });
    } else {
      obj.id = ids;
      patchHelper(obj);
    }
  });

  return archiveObject;
};

export default patchRelationships;
