export const message = (table, field, id) => (
  `Tried updating the field '${field}' on table '${table}' with id '${id}', but the record's new ` +
  'id was probably not supplied, because it is undefined.'
);

export default (table, field, id) => new Error(message(table, field, id));
