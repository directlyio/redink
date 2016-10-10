export default (inverseRelation) => {
  switch (inverseRelation) {
    case 'hasMany':
    case 'hasOne':
      return true;
    case 'belongsTo':
    default:
      return false;
  }
};
