/* eslint-disable no-param-reassign */
export default (record, schema) => {
  const normalizedRecord = {
    ...record,
    _meta: {
      _archived: false,
    },
  };

  const normalize = (id) => ({
    id,
    _archived: false,
    _related: true,
  });

  const normalizeMany = (ids) => ids.map(id => normalize(id));

  Object.keys(schema.relationships).forEach(relationship => {
    const relationshipObject = schema.relationships[relationship];
    const { field, relation, inverse } = relationshipObject;
    const data = record[field];

    if (record.hasOwnProperty(field)) {
      switch (relation) {
        case 'hasMany':
          if (inverse.relation === 'hasMany') normalizedRecord[field] = normalizeMany(data);
          else delete normalizedRecord[field];
          break;

        case 'hasOne':
        case 'belongsTo':
          if (!data) normalizedRecord[field] = data;
          else normalizedRecord[field] = normalize(data);
          break;

        default:
          throw new Error(
            `Tried to normalize record with an invalid relationship of type '${relation}'`
          );
      }
    }
  });

  return normalizedRecord;
};
