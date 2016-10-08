import { checkChecks } from './utils';

export default (record, schema) => (
  schema.relationships.map(relationship => {
    if (!record.includes(relationship.field)) return true;

    const { relation, inverse } = relationship;
    const inverseRelation = inverse.relation;

    switch (`${relation} -> ${inverseRelation}`) {
      case 'hasMany -> hasMany':
        const checks = [];
        return checkChecks(checks, options)
          .then(didPass);

        break;
      case 'hasMany -> hasOne':

        break;
      case 'hasMany -> belongsTo':

        break;
      case 'hasOne -> hasOne':

        break;
      case 'hasOne -> hasMany':

        break;
      case 'hasOne -> belongsTo':

        break;
      case 'belongsTo -> hasMany':

        break;
      case 'belongsTo -> hasOne':

        break;
      default:
        throw new Error(`Invalid relationship pair '${relation}' -> '${inverseRelation}'`);
    }
  })
);
