const initialValue = {
  _meta: {
    _archived: true,
  },
};

export default (node) => node.relationships.reduce((prev, relationship) => {
  const { relation, field, inverse: { relation: inverseRelation } } = relationship;

  if (relation === 'hasOne' && inverseRelation === 'belongsTo') {
    return {
      ...prev,
      relationships: {
        ...prev.relationships,
        [field]: {
          ...prev.relationships[field],
          _archived: true,
        },
      },
    };
  }

  return prev;
}, initialValue);
