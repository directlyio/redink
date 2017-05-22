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
          friends: ['2', '3'],
        })
      ));

    console.log(user.relationships);

    t.truthy(user instanceof Node);
    t.is(user.attribute('name'), 'CJ');
    t.is(user.attribute('email'), undefined);
  } catch (err) {
    t.fail(err.message);
  }
});
