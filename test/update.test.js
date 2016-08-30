process.env.REDINK_DEBUG = true;
process.env.BABEL_ENV = 'development';

import test from 'ava';
import applyHooks from './helpers/applyHooks';
import { db } from '../src/dbSingleton';
import { message as missingOldIdsMessage } from '../src/errors/missingOldIds';
import { message as missingNewIdsMessage } from '../src/errors/missingNewIds';
import { message as nonExistingRelationshipMessage } from '../src/errors/nonExistingRelationship';

applyHooks(test);

test('should successfully update a user', async t => {
  try {
    const update = {
      name: 'Benny Franklin',
    };

    const user = await db().instance().update('user', '1', update);
    const expected = {
      id: '1',
      name: 'Benny Franklin',
      pets: [{
        id: '1',
        species: 'Dog',
        owner: '1',
      }],
      company: {
        id: '1',
        name: 'Directly, Inc.',
        employees: ['1'],
      },
      planet: {
        id: '1',
        name: 'Earth',
        inhabitants: ['1'],
      },
    };

    t.deepEqual(user, expected);
  } catch (err) {
    console.log('err:', err);
    t.fail(err);
  }
});

test('should fail to update the user\'s `hasMany` relationship (1)', async t => {
  try {
    const update = {
      name: 'Benny Franklin',
      pets: {
        old: ['1'],
      },
    };

    await db().instance().update('user', '1', update);
    t.fail();
  } catch (err) {
    t.is(err.message, missingNewIdsMessage('user', 'pets', '1'));
  }
});

test('should fail to update the user\'s `hasMany` relationship (2)', async t => {
  try {
    const update = {
      name: 'Benny Franklin',
      pets: {
        new: ['1'],
      },
    };

    await db().instance().update('user', '1', update);
    t.fail();
  } catch (err) {
    t.is(err.message, missingOldIdsMessage('user', 'pets', '1'));
  }
});

test('should fail to update the user\'s `hasMany` relationship (3)', async t => {
  try {
    const update = {
      name: 'Benny Franklin',
      pets: {
        old: ['1'],
        new: ['1', '2'],
      },
    };

    await db().instance().update('user', '1', update);
    t.fail();
  } catch (err) {
    t.is(err.message, nonExistingRelationshipMessage('user', '1', 'pets'));
  }
});

test('should fail to update the user\'s `hasOne` relationship', async t => {
  try {
    const update = {
      name: 'Benny Franklin',
      company: {
        old: '1',
        new: '2',
      },
    };

    await db().instance().update('user', '1', update);
    t.fail();
  } catch (err) {
    t.is(err.message, nonExistingRelationshipMessage('user', '1', 'company'));
  }
});

test('should fail to update the user\'s `belongsTo` relationship', async t => {
  try {
    const update = {
      name: 'Benny Franklin',
      planet: {
        old: '1',
        new: '2',
      },
    };

    await db().instance().update('user', '1', update);
    t.fail();
  } catch (err) {
    t.is(err.message, nonExistingRelationshipMessage('user', '1', 'planet'));
  }
});
