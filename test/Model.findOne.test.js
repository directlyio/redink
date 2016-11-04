import test from 'ava';
import Node from '../src/Node';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should find first user', async t => {
  try {
    const user = await model('user').findOne();

    t.truthy(user instanceof Node);
  } catch (err) {
    t.fail(err.message);
  }
});

test('should find billy', async t => {
  try {
    const user = await model('user').findOne({
      filter: { name: 'Billy' },
    });

    t.truthy(user instanceof Node);
    t.is(user.attribute('name'), 'Billy');
  } catch (err) {
    t.fail(err.message);
  }
});

test('should be null', async t => {
  try {
    const user = await model('user').findOne({
      filter: { name: 'Invalid name' },
    });

    t.is(user, null);
  } catch (err) {
    t.fail(err.message);
  }
});
