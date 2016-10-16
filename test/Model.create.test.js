import test from 'ava';
import Resource from '../src/Resource';
import ResourceArray from '../src/ResourceArray';
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

    const employees = await model('company').fetchResource('1')
      .then(res => res.fetch('employees'));

    const friends = await model('user').fetchResource('1')
      .then(res => res.fetch('friends'));

    t.truthy(employees instanceof ResourceArray);
    t.truthy(friends instanceof ResourceArray);
    t.truthy(user instanceof Resource);

    t.is(user.attribute('name'), 'CJ');
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

test('should create a blog that belongs to a user', async t => {
  try {
    const blog = await model('blog').create({
      title: 'Super Cool Blog',
      author: '1',
    });

    const user = await model('user').fetchResource('1', {
      include: { blogs: true },
    });

    t.truthy(blog instanceof Resource);
    t.is(user.retrieve('blogs').length, 2);
  } catch (err) {
    t.fail(err.message);
  }
});
