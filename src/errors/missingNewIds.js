export const message = (table, field, id) => (
  `Tried updating the field '${field}' on table '${table}' with id '${id}', but the record's new ` +
  'ids were probably not supplied, because they are undefined.'
);

export default (table, field, id) => new Error(message(table, field, id));
