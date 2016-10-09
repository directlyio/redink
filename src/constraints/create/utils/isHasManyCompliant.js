import { checkValidIds } from '../../checks';

export default (inverse, data, conn) => {
  const { relation, type } = inverse;

  switch (relation) {
    case 'hasMany':
      // check relationship with original relation `hasMany`
      if (data === []) return true;
      return checkValidIds(type, data, conn);

    case 'hasOne':
      // check relationship with original relation `hasOne`
      return true;

    case 'belongsTo':
      // check relationship with original relation `belongsTo`
      return true;

    default:
      throw new Error(`Invalid inverse relationship of type '${relation}'`);
  }
};
