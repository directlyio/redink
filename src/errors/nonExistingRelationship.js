export const message = (type, id, field) => (
  `Tried updating a record of type '${type}' with id '${id}', but the '${field}' ` +
  'relationship payload is/includes an id of a non-existing record.'
);

export default (type, id, field) => new Error(message(type, id, field));
