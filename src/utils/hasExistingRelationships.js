import nonExistingRelationship from '../errors/nonExistingRelationship';

export default (type, id, relationships) => {
  const relationshipsKeys = Object.keys(relationships);

  if (!relationshipsKeys.length) return true;

  return relationshipsKeys
    .map(key => ([key, relationships[key]]))
    .forEach(([key, isValid]) => {
      if (!isValid) {
        throw nonExistingRelationship(type, key, id);
      }
    });
};
