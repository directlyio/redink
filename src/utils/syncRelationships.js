/* eslint-disable no-param-reassign */
import {
  pushInverse,
  put,
  putMany,
} from '../queries';

export default (record, schema, id) => {
  const syncRelationshipsArray = [];

  Object.keys(schema.relationships).forEach(relationship => {
    const relationshipObject = schema.relationships[relationship];
    const { field, relation, inverse } = relationshipObject;
    const { type: inverseType, field: inverseField, relation: inverseRelation } = inverse;

    const data = record[field];

    let queryToPush;

    if (record.hasOwnProperty(field)) {
      if (inverseRelation === 'hasMany') {
        queryToPush = Array.isArray(data)
          ? pushInverse(inverseType, inverseField, [], data, id)
          : pushInverse(inverseType, inverseField, [], [data], id);
      }

      if (inverseRelation === 'hasOne') {
        queryToPush = relation === 'hasMany'
          ? putMany(inverseType, data, inverseField, id)
          : put(inverseType, data, inverseField, id);
      }

      if (queryToPush) syncRelationshipsArray.push(queryToPush);
    }
  });

  return syncRelationshipsArray;
};
