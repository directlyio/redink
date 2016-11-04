import Node from '../Node';
import Connection from '../Connection';

const isArrayOfStrings = (array) => {
  if (!Array.isArray(array)) return false;
  return array.every(item => typeof item === 'string');
};

export default (data) => (
  data instanceof Node ||
  data instanceof Connection ||
  isArrayOfStrings(data) ||
  typeof data === 'string'
);
