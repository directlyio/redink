import test from 'ava';
import getRelationships from '../../src/utils/getRelationships';
import { schemas } from '../fixtures';

test('Table with no relationships.', t => {
  const noRelationships = getRelationships('user', schemas);

  t.deepEqual(noRelationships, {});
});

test('Ensure `rel` only grows if `inverse` is correct.', t => {
  const rightInverse = getRelationships('animal', schemas);
  const rightInverseResult = {
    owner: {
      table: 'individual',
      original: 'belongsTo',
      inverse: 'hasMany',
      inverseField: 'pets',
    },
  };

  t.deepEqual(rightInverse, rightInverseResult);
});

test('Table with embedded relationships on both ends.', t => {
  const embedded = getRelationships('form', schemas);
  const embeddedResult = {
    brand: {
      table: 'brand',
      original: 'belongsTo',
      inverse: 'hasMany',
      inverseField: 'forms',
    },
    data: {
      table: 'data',
      original: 'hasMany',
      inverse: 'belongsTo',
      inverseField: 'form',
    },
  };

  t.deepEqual(embedded, embeddedResult);
});

test('Relationship field has too many (non-embedded) properties.', t => {
  const schemaOne = {
    funky: {
      relationships: {
        monkey: {
          belongsTo: 'too',
          hasMany: 'many',
          inverse: 'pizza',
        },
      },
    },
  };

  t.throws(() => {
    getRelationships('funky', schemaOne);
  }, 'Incorrect number of properties, expecting 2.', 'Incorrect number of properties');
});

test('Relationship field has an invalid (relationship type) key', t => {
  const schemaTwo = {
    funky: {
      relationships: {
        monkey: {
          invalidKey: 'wrong',
          inverse: 'hey',
        },
      },
    },
  };

  t.throws(() => {
    getRelationships('funky', schemaTwo);
  }, 'Invalid relationship type, expecting `hasMany`, `belongsTo`, or `hasOne`.',
     'Invalid relationship key');
});
