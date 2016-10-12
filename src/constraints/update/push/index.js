import {
  checkValidIds,
  checkManyInverseHasOne,
} from '../../checks';

export default (relationshipObject, ids, conn) => {
  const { type, inverse: { relation: inverseRelation, field: inverseField } } = relationshipObject;

  switch (inverseRelation) {
    case 'hasMany':
      return checkValidIds(type, ids, conn);

    case 'hasOne':
      return checkManyInverseHasOne(type, ids, inverseField, conn);

    case 'belongsTo':
    default:
      return Promise.resolve(false);
  }
};
