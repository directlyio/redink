const initial = {
  _meta: {
    _archived: true,
  },
};

export default (resource) => (
  Object.keys(resource.relationships).reduce((prev, curr) => {
    const { relation, inverse: { relation: inverseRelation } } = resource.relationship(curr);

    if (relation === 'hasOne' && inverseRelation === 'belongsTo') {
      return {
        ...prev,
        relationships: {
          ...prev.relationships,
          [curr]: {
            ...prev.relationships[curr],
            _archived: true,
          },
        },
      };
    }

    return prev;
  }, initial)
);
