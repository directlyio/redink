import test from 'ava';
import Node from '../src/Node';
import Connection from '../src/Connection';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should fetch a user\'s relationships', async t => {
  try {
    const user = await model('user').fetch('1');
    const blogs = await user.fetch('blogs');
    const friends = await user.fetch('friends');
    const company = await user.fetch('company');
    const employees = await company.fetch('employees');

    t.truthy(user instanceof Node);
    t.is(user.schema.type, 'user');
    t.truthy(blogs instanceof Connection);
    t.is(blogs.schema.type, 'blog');
    t.truthy(friends instanceof Connection);
    t.is(friends.schema.type, 'user');
    t.truthy(company instanceof Node);
    t.is(company.schema.type, 'company');
    t.truthy(employees instanceof Connection);
    t.is(employees.schema.type, 'user');
    t.truthy(employees.first() instanceof Node);
  } catch (err) {
    t.fail(err.message);
  }
});
