import r from 'rethinkdb';
import hasValidRelationships from '../queries/hasValidRelationships';
import invalidSchemaType from '../errors/invalidSchemaType';
import getRelationships from './getRelationships';
import * as relationshipTypes from '../constants/relationshipTypes';

const { keys } = Object;
const { isArray } = Array;

export default (schemas, type, data, isUpdate = false) => {
  if (!schemas.hasOwnProperty(type)) {
    throw invalidSchemaType(type);
  }

  const relationships = getRelationships(schemas, type);
  const relationshipKeys = keys(relationships);
  const dataKeys = keys(data);

  return r({}).merge(r.args(dataKeys.map(key => {
    if (!relationshipKeys.includes(key)) return {};

    let idsToCheck;

    // if the request is an update, expect `new` and `old` keys
    if (isUpdate) {
      const { new: newIdOrIds, old: oldIdOrIds } = data[key];
      const relationshipType = relationships[key].original;

      // expect both new and old ids to be arrays
      if (relationshipType === relationshipTypes.HAS_MANY) {
        if (!isArray(newIdOrIds) || !isArray(oldIdOrIds)) {
          throw new Error(
            `Tried performing an operation on a ${relationshipType} relationship, but the old ` +
            'ids and/or new ids was not supplied as an array.'
          );
        }

        idsToCheck = oldIdOrIds.concat(newIdOrIds);
      } else {
        if (isArray(newIdOrIds) || isArray(oldIdOrIds)) {
          throw new Error(
            `Tried performing an operation on a ${relationshipType} relationship, but the old ` +
            'id and/or new id was not supplied as a string.'
          );
        }

        idsToCheck = [oldIdOrIds, newIdOrIds];
      }
    }

    // dedupe
    idsToCheck = Array.from(new Set(idsToCheck));

    return {
      [key]: hasValidRelationships(relationships[key].table, idsToCheck),
    };
  })));
};
