/* eslint-disable no-param-reassign */
import { forEach } from 'lodash';

export default ({ record, schema }) => {
  const normalize = (id) => ({
    id,
    _archived: false,
    _related: true,
  });

  const normalizeMany = (ids) => ids.map(id => normalize(id));

  forEach(schema.relationships, (relationship) => {
    const { field, relation } = relationship;
    const data = record[field];

    let newData;

    if (record.includes(field)) {
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

  return record;
};
