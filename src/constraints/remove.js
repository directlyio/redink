export default (inverseRelation) => (
  inverseRelation === 'hasMany' || inverseRelation === 'hasOne'
);
