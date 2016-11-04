import test from 'ava';
import Node from '../src/Node';
import Connection from '../src/Connection';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should create a user and sync it\'s relationships', async t => {
  try {
    const user = await model('user').create({
      name: 'CJ',
      friends: ['1'],
      company: '1',
    });

    const employees = await model('company').findRelated('1', 'employees');
    const friends = await model('user').findRelated('1', 'friends');

    t.truthy(employees instanceof Connection);
    t.truthy(friends instanceof Connection);
    t.truthy(user instanceof Node);

    t.is(user.attribute('name'), 'CJ');
    t.is(employees.totalCount, 2);
    t.is(friends.totalCount, 2);
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

test('should create a blog that belongs to a user', async t => {
  try {
    const blog = await model('blog').create({
      title: 'Super Cool Blog',
      author: '1',
    });

    const user = await model('user').fetch('1', {
      include: { blogs: true },
    });

    t.truthy(blog instanceof Node);
    t.is(user.retrieve('blogs').totalCount, 2);
  } catch (err) {
    t.fail(err.message);
  }
});
