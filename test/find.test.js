process.env.REDINK_DEBUG = true;

import test from 'ava';
import applyHooks from './helpers/applyHooks';
import { db } from '../src/dbSingleton';

applyHooks(test);

test('should find all users with properly hydrated relationships', async t => {
  try {
    const users = await db().instance().find('user');
    const expected = [{
      id: '1',
      name: 'Ben Franklin',
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
    }];

    t.deepEqual(users, expected);
  } catch (err) {
    t.fail(err);
  }
});
