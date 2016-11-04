import test from 'ava';
import Node from '../src/Node';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should remove a user\'s company', async t => {
  try {
    const before = await model('user').fetch('1');

    const after = await model('user').fetch('1')
      .then(user => (
        user.remove('company')
      ));

    t.truthy(before instanceof Node);
    t.truthy(after instanceof Node);
    t.is(before.relationship('company').isRelated(), true);
    t.is(after.relationship('company').isRelated(), false);
  } catch (err) {
    t.fail(err.message);
  }
});
