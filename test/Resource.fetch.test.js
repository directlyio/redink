import test from 'ava';
import Resource from '../src/Resource';
import ResourceArray from '../src/ResourceArray';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should fetch a user\'s relationships', async t => {
  try {
    const user = await model('user').fetchResource('1');
    const blogs = await user.fetch('blogs');
    const friends = await user.fetch('friends');
    const company = await user.fetch('company');
    const employees = await company.fetch('employees');

    t.truthy(user instanceof Resource);
    t.truthy(blogs instanceof ResourceArray);
    t.truthy(friends instanceof ResourceArray);
    t.truthy(company instanceof Resource);
    t.truthy(employees instanceof ResourceArray);
    t.truthy(employees.first() instanceof Resource);
  } catch (err) {
    t.fail(err.message);
  }
});
