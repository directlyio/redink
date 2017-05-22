import test from 'ava';
import Node from '../src/Node';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should update a user\'s relationships', async t => {
  try {
    const user = await model('user').fetch('1')
      .then(userNode => (
        userNode.updateRelationships({
          name: 'CJ',
          email: 'brewercalvinj@gmail.com',
          friends: ['3'],
        })
      ));

    t.truthy(user instanceof Node);
    t.is(user.attribute('name'), 'Bob');
    t.is(user.relationship('friends').data[1].id, '3');
    t.is(user.relationship('friends').data[0]._related, false);
    t.is(user.retrieve('friends').length, 2);
  } catch (err) {
    t.fail(err.message);
  }
});
