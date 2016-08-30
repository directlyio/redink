export const message = (type) => (
  `Tried accessing a schema of type '${type}', but it is not registered.`
);

export default (type) => new Error(message(type));
