import test from 'ava';
import Node from '../src/Node';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should splice a user\'s friends with id \'2\'', async t => {
  try {
    const before = await model('user').fetch('1');

    const after = await model('user').fetch('1')
      .then(user => (
        user.splice('friends', '2')
      ));

    t.truthy(before instanceof Node);
    t.truthy(after instanceof Node);
    t.is(before.relationship('friends').data[0]._related, true);
    t.is(after.relationship('friends').data[0]._related, false);

    const inverse = await model('user').fetch('2');

    t.truthy(inverse instanceof Node);
    t.is(inverse.relationship('friends').data[0]._related, false);
  } catch (err) {
    t.fail(err.message);
  }
});
