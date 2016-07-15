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

  try {
    getRelationships('funky', schemaOne);
  } catch (e) {
    if (e instanceof Error && e.message === 'Incorrect number of properties.') {
      t.pass('Proper error was thrown.');
    } else {
      t.fail('Not the expected error.');
    }
  }
});

test('Relationship field has an invalid (relationship type) key.', t => {
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

  try {
    getRelationships('funky', schemaTwo);
  } catch (e) {
    if (e instanceof Error && e.message === 'Invalid relationship type.') {
      t.pass('Proper error was thrown.');
    } else {
      t.fail('Not the expected error.');
    }
  }
});
