export const message = (table, field) => (
  `Tried accessing the '${field}' relationship on table '${table}', but the '${table}' schema ` +
  `does have a '${field}' relationship.`
);

export default (table, field) => new Error(message(table, field));
