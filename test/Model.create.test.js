import test from 'ava';
import Resource from '../src/Resource';
import ResourceArray from '../src/ResourceArray';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should create a user', async t => {
  try {
    const user = await model('user').create({
      name: 'CJ',
      blogs: [],
      friends: ['1'],
      company: '1',
    });

    const employees = await model('company').fetchResource('1').then(company => (
      company.fetch('employees').then(employeesArray => employeesArray)
    ));

    const friends = await model('user').fetchResource('1').then(userResource => (
      userResource.fetch('friends').then(friendsArray => friendsArray)
    ));

    t.truthy(employees instanceof ResourceArray);
    t.truthy(friends instanceof ResourceArray);
    t.truthy(user instanceof Resource);

    t.is(employees.toArray().length, 2);
    t.is(friends.toArray().length, 2);
  } catch (err) {
    t.fail(err.message);
  }
});

test('should fail to create a user because the company doesn\'t exist', async t => {
  try {
    await model('user').create({
      name: 'CJ',
      blogs: [],
      friends: ['1'],
      company: 'invalid',
    });
  } catch (err) {
    t.is(
      err.message,
      'Expected a valid record of type \'company\' but got invalid record with id of \'invalid\'.'
    );
  }
});
