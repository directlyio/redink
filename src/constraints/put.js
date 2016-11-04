import {
  checkValidId,
  checkInverseHasOne,
} from './checks';

export default (relationshipObject, id, conn) => {
  const {
    schema,
    relation,
    inverse: {
      relation: inverseRelation,
      field: inverseField,
    },
  } = relationshipObject;

  if (relation === 'belongsTo') return Promise.resolve(false);

  switch (inverseRelation) {
    case 'hasMany':
      return checkValidId(schema.type, id, conn);

    case 'hasOne':
      return checkInverseHasOne(schema.type, id, inverseField, conn);

    case 'belongsTo':
    default:
      return Promise.resolve(false);
  }
};
