import test from 'ava';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should fetch a single user', async t => {
  try {
    const user = await model('user').fetchResource('1');
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

    console.log(user.relationship('company'));
    console.log(user.relationship('blogs'));
    console.log(user.toObject());

    const company = await user.fetch('company');
    console.log('company:', company.toObject());

    const employees = await company.fetch('employees');
    console.log('employees', employees.toArray());

    t.deepEqual(user, expected);
  } catch (err) {
    console.log('err:', err);
    t.fail(err);
  }
});
