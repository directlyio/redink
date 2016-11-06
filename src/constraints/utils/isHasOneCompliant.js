import { checkValidId, checkInverseHasOne } from '../checks';

export default (relationship, data, conn) => {
  const { inverse, name } = relationship;
  const { relation, field } = inverse;

  if (data === '') return true;

  switch (relation) {
    case 'hasMany':
      // check relationship with inverse relation `hasMany`
      return checkValidId(name, data, conn);

    case 'hasOne':
      // check relationship with inverse relation `hasOne`
      return checkInverseHasOne(name, data, field, conn);

    case 'belongsTo':
      // check relationship with inverse relation `belongsTo`
      return false;

    default:
      throw new Error(`Invalid inverse relationship of type '${relation}'`);
  }
};
