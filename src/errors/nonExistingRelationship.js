export const message = (type, field, id) => (
  `Tried updating a record of type '${type}' with id '${id}', but the '${field}' ` +
  'relationship payload is/includes an id of a non-existing record.'
);

export default (type, field, id) => new Error(message(type, field, id));
