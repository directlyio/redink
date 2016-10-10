export default (inverseRelation) => {
  switch (inverseRelation) {
    case 'hasMany':
      return true;
    case 'hasOne':
    case 'belongsTo':
    default:
      return false;
  }
};
