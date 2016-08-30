const { keys } = Object;

export default (filter, relationships) => {
  const parsed = {};

  keys(filter).forEach(key => {
    if (keys(relationships).includes(key)) {
      parsed[key] = {
        id: filter[key],
      };
    } else {
      parsed[key] = filter[key];
    }
  });

  return parsed;
};
