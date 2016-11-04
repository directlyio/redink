import test from 'ava';
import Node from '../src/Node';
import Connection from '../src/Connection';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should find the first user\'s friends', async t => {
  try {
    const friends = await model('user').findRelated('1', 'friends');

    t.truthy(friends instanceof Connection);
  } catch (err) {
    t.fail(err.message);
  }
});

test('should find the first user\'s blogs', async t => {
  try {
    const blogs = await model('user').findRelated('1', 'blogs');

    t.truthy(blogs instanceof Connection);
  } catch (err) {
    t.fail(err.message);
  }
});

test('should find the first user\'s company', async t => {
  try {
    const company = await model('user').findRelated('1', 'company');

    t.truthy(company instanceof Node);
  } catch (err) {
    t.fail(err.message);
  }
});
