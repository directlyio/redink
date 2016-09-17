import test from 'ava';
import applyHooks from './helpers/applyHooks';
import { db } from '../src/dbSingleton';

applyHooks(test);

test('should successfully create a user', async t => {
  try {
    const record = {
      name: 'Thomas Jefferson',
      company: '1',
      pets: ['1'],
      planet: '1',
    };

    const user = await db().instance().create('user', record);
    const expected = {
      id: user.id,
      name: 'Thomas Jefferson',
      company: {
        id: '1',
        name: 'Directly, Inc.',
        employees: ['1', user.id],
      },
      pets: [{
        id: '1',
        species: 'Dog',
        owner: '1',
      }],
      planet: {
        id: '1',
        name: 'Earth',
        inhabitants: ['1', user.id],
      },
    };

    t.deepEqual(user, expected);
  } catch (err) {
    t.fail(err);
  }
});
