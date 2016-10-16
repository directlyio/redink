/* eslint-disable no-param-reassign */
import hasOwnProperty from './hasOwnProperty';

import {
  pushIdToInverseField,
  putIdToRecordField,
  putIdToManyRecordsField,
} from '../queries';

export default (record, schema, id) => {
  const syncRelationshipsArray = [];

  Object.keys(schema.relationships).forEach(relationship => {
    const relationshipObject = schema.relationships[relationship];
    const { field, relation, inverse } = relationshipObject;
    const { type: inverseType, field: inverseField, relation: inverseRelation } = inverse;

    const data = record[field];

    let queryToPush;

    if (hasOwnProperty(record, field)) {
      if (inverseRelation === 'hasMany') {
        const dataCoercedToArray = Array.isArray(data) ? data : [data];
        queryToPush = pushIdToInverseField(inverseType, inverseField, [], dataCoercedToArray, id);
      }

      if (inverseRelation === 'hasOne') {
        queryToPush = relation === 'hasMany'
          ? putIdToManyRecordsField(inverseType, data, inverseField, id)
          : putIdToRecordField(inverseType, data, inverseField, id);
      }

      if (queryToPush) syncRelationshipsArray.push(queryToPush);
    }
  });

  return syncRelationshipsArray;
};
