import hasOwnProperty from './hasOwnProperty';

import {
  pushIdToInverseField,
  putIdToRecordField,
  putIdToManyRecordsField,
} from '../queries';

export default (record, type, id) => {
  const syncRelationshipsArray = [];

  type.relationships.forEach(relationship => {
    const { field, name, relation, inverse } = relationship;
    const { field: inverseField, relation: inverseRelation } = inverse;
    const data = record[field];

    let queryToPush;

    if (hasOwnProperty(record, field)) {
      if (inverseRelation === 'hasMany') {
        const dataCoercedToArray = Array.isArray(data) ? data : [data];

        queryToPush = pushIdToInverseField(
          name,
          inverseField,
          [],
          dataCoercedToArray,
          id,
        );
      }

      if (inverseRelation === 'hasOne') {
        queryToPush = relation === 'hasMany'
          ? putIdToManyRecordsField(name, data, inverseField, id)
          : putIdToRecordField(name, data, inverseField, id);
      }

      if (queryToPush) syncRelationshipsArray.push(queryToPush);
    }
  });

  return syncRelationshipsArray;
};
