import test from 'ava';
import Node from '../src/Node';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should append a user\'s friends with id \'3\'', async t => {
  try {
    const before = await model('user').fetch('1');

    const after = await model('user').fetch('1')
      .then(user => (
        user.push('friends', '3')
      ));

    t.truthy(before instanceof Node);
    t.truthy(after instanceof Node);

    t.is(before.relationship('friends').data[1], undefined);
    t.is(after.relationship('friends').data[1].id, '3');

    const inverse = await model('user').fetch('3');

    t.truthy(inverse instanceof Node);
    t.is(inverse.relationship('friends').data[0].id, '1');
  } catch (err) {
    t.fail(err.message);
  }
});
