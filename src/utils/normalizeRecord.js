/* eslint-disable no-param-reassign */
export default ({ record, schema }) => {
  const normalize = (id) => ({
    id,
    _archived: false,
    _related: true,
  });

  const normalizeMany = (ids) => ids.map(id => normalize(id));

  Object.keys(schema.relationships).forEach(relationship => {
    const relationshipObject = schema.relationships[relationship];
    const { field, relation } = relationshipObject;
    const data = record[field];

    let newData;

    if (record.hasOwnProperty(field)) {
      switch (relation) {
        case 'hasMany':
          newData = normalizeMany(data);
          break;

        case 'hasOne':
        case 'belongsTo':
          if (!data) newData = data;
          else newData = normalize(data);
          break;

        default:
          throw new Error(
            `Invalid relation of type '${relation}'`
          );
      }
    }

    record[field] = newData;
  });

  record._meta = {
    _archived: false,
  };

  return record;
};
