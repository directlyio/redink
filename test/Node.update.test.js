import test from 'ava';
import Node from '../src/Node';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should update a user\'s attributes', async t => {
  try {
    const user = await model('user').fetch('1')
      .then(userNode => (
        userNode.update({
          name: 'CJ',
          email: 'brewercalvinj@gmail.com',
        })
      ));

    t.truthy(user instanceof Node);
    t.is(user.attribute('name'), 'CJ');
    t.is(user.attribute('email'), undefined);
  } catch (err) {
    t.fail(err.message);
  }
});
