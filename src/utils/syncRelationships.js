import hasOwnProperty from './hasOwnProperty';

import {
  pushIdToInverseField,
  putIdToRecordField,
  putIdToManyRecordsField,
} from '../queries';

export default (record, type, id) => {
  const syncRelationshipsArray = [];

  type.relationships.forEach(relationship => {
    const { field, relation, inverse } = relationship;
    const { name: inverseName, field: inverseField, relation: inverseRelation } = inverse;

    const data = record[field];

    let queryToPush;

    if (hasOwnProperty(record, field)) {
      if (inverseRelation === 'hasMany') {
        const dataCoercedToArray = Array.isArray(data) ? data : [data];
        queryToPush = pushIdToInverseField(inverseName, inverseField, [], dataCoercedToArray, id);
      }

      if (inverseRelation === 'hasOne') {
        queryToPush = relation === 'hasMany'
          ? putIdToManyRecordsField(inverseName, data, inverseField, id)
          : putIdToRecordField(inverseName, data, inverseField, id);
      }

      if (queryToPush) syncRelationshipsArray.push(queryToPush);
    }
  });

  return syncRelationshipsArray;
};
