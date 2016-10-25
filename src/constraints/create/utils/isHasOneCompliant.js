import { checkValidId, checkInverseHasOne } from '../../checks';

export default (relationship, data, conn) => {
  const { inverse, type } = relationship;
  const { relation, field } = inverse;

  if (data === '') return true;

  switch (relation) {
    case 'hasMany':
      // check relationship with inverse relation `hasMany`
      return checkValidId(type, data, conn);

    case 'hasOne':
      // check relationship with inverse relation `hasOne`
      return checkInverseHasOne(type, data, field, conn);

    case 'belongsTo':
      // check relationship with inverse relation `belongsTo`
      return false;

    default:
      throw new Error(`Invalid inverse relationship of type '${relation}'`);
  }
};
