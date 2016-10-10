import {
  checkValidId,
  checkInverseHasOne,
} from '../../checks';

export default (relationshipObject, id, conn) => {
  const {
    type,
    relation,
    inverse: {
      relation: inverseRelation,
      field: inverseField,
    },
  } = relationshipObject;

  if (relation === 'belongsTo') return Promise.resolve(false);

  switch (inverseRelation) {
    case 'hasMany':
      return checkValidId(type, id, conn);
    case 'hasOne':
      return checkInverseHasOne(type, id, inverseField, conn);
    case 'belongsTo':
    default:
      return Promise.resolve(false);
  }
};
