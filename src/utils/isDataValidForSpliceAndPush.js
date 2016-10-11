import Resource from '../Resource';
import ResourceArray from '../ResourceArray';

const isArrayOfStrings = (array) => {
  if (!Array.isArray(array)) return false;

  return array.every(item => typeof item === 'string');
};

export default (data) => (
  data instanceof Resource ||
  data instanceof ResourceArray ||
  isArrayOfStrings(data) ||
  typeof data === 'string'
);
