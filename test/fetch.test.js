process.env.REDINK_DEBUG = true;

import test from 'ava';
import applyHooks from './helpers/applyHooks';
import { db } from '../src/dbSingleton';

applyHooks(test);

test('should fetch a single user', async t => {
  try {
    const user = await db().instance().fetch('user', '1');
    const expected = {
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
    };

    t.deepEqual(user, expected);
  } catch (err) {
    t.fail(err);
  }
});
