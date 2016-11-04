import { hasOwnProperty } from '../utils';

import {
  isHasManyCompliant,
  isHasOneCompliant,
  isBelongsToCompliant,
} from './utils';

export default (record, schema, conn) => {
  const isTrue = check => (check === true);
  const checkPass = response => response.every(isTrue);

  const checkManyToMany = (data, field) => {
    if (!Array.isArray(data)) {
      throw new Error(
        `Expected record to include '${field}' with either an empty array or array of ids.`
      );
    }
  };

  const checkBelongsTo = (data, field) => {
    if (!data) {
      throw new Error(
        `Expected record to include '${field}' set with an id.`
      );
    }
  };

  return Promise.all(Object.keys(schema.relationships).reduce((prev, next) => {
    const relationship = schema.relationships[next];
    const { relation, inverse, field } = relationship;
    const data = record[field];

    if (relation === 'hasMany' && inverse.relation === 'hasMany') checkManyToMany(data, field);
    if (relation === 'belongsTo') checkBelongsTo(data, field);

    if (!hasOwnProperty(record, field)) return [...prev, true];

    switch (relation) {
      case 'hasMany':
        // check relationship with original relation `hasMany`
        return [...prev, isHasManyCompliant(relationship, data, conn)];

      case 'hasOne':
        // check relationship with original relation `hasOne`
        return [...prev, isHasOneCompliant(relationship, data, conn)];

      case 'belongsTo':
        // check relationship with original relation `belongsTo`
        return [...prev, isBelongsToCompliant(relationship, data, conn)];

      default:
        throw new Error(`Invalid relationship of type '${relation}'`);
    }
  }, [])).then(checkPass);
};
