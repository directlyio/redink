import test from 'ava';
import Connection from '../src/Connection';
import Node from '../src/Node';
import Relationship from '../src/Relationship';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should fetch a single user node', async t => {
  try {
    const user = await model('user').fetch('1');

    t.is(user.id, '1');
    t.truthy(user instanceof Node);
    user.relationships.forEach(relationship => t.truthy(relationship instanceof Relationship));
  } catch (err) {
    t.fail(err.message);
  }
});

test('should fetch a single user node with sideloaded relationships', async t => {
  try {
    const user = await model('user').fetch('1', {
      include: { friends: true, company: true, blogs: true },
    });

    t.truthy(user instanceof Node);
    t.is(user.id, '1');
    t.truthy(user.retrieve('friends') instanceof Connection);
    t.truthy(user.retrieve('blogs') instanceof Connection);
    t.truthy(user.retrieve('company') instanceof Node);
  } catch (err) {
    t.fail(err.message);
  }
});

test('should fetch a single user with nested include', async t => {
  try {
    const user = await model('user').fetch('1', {
      include: {
        friends: {
          filter: (friend) => friend('name').eq('Invalid name'),
        },
      },
    });

    t.truthy(user.retrieve('friends') instanceof Connection);
    t.is(user.retrieve('friends').totalCount, 0);
    t.is(user.id, '1');
  } catch (err) {
    t.fail(err.message);
  }
});
