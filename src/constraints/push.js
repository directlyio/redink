import {
  checkValidIds,
  checkManyInverseHasOne,
} from './checks';

export default (relationshipObject, ids, conn) => {
  const {
    schema,
    inverse: {
      relation: inverseRelation,
      field: inverseField,
    },
  } = relationshipObject;

  switch (inverseRelation) {
    case 'hasMany':
      return checkValidIds(schema.type, ids, conn);

    case 'hasOne':
      return checkManyInverseHasOne(schema.type, ids, inverseField, conn);

    case 'belongsTo':
    default:
      return Promise.resolve(false);
  }
};
