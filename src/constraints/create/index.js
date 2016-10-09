import {
  isHasManyCompliant,
  isHasOneCompliant,
  isBelongsToCompliant,
} from './utils';

export default (record, schema, conn) => {
  const isTrue = check => (check === true);
  const checkPass = response => response.every(isTrue);

  return Promise
    .all(schema.relationships.map(relationship => {
      if (!record.includes(relationship.field)) return true;

      const { relation, inverse } = relationship;

      switch (relation) {
        case 'hasMany':
          // check relationship with original relation `hasMany`
          return isHasManyCompliant(inverse, record[relationship], conn);

        case 'hasOne':
          // check relationship with original relation `hasOne`
          return isHasOneCompliant(inverse, record[relationship], conn);

        case 'belongsTo':
          // check relationship with original relation `belongsTo`
          return isBelongsToCompliant(inverse, record[relationship], conn);

        default:
          throw new Error(`Invalid relationship of type '${relation}'`);
      }
    }))
    .then(checkPass);
};
