import test from 'ava';
import Resource from '../src/Resource';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should append a user\'s friends with id \'3\'', async t => {
  try {
    const user = await model('user').fetchResource('1')
      .then(userResource => (
        userResource.push('friends', '3')
      ));

    t.truthy(user instanceof Resource);
    t.is(user.relationship('friends').records[1].id, '3');

    const inverseUser = await model('user').fetchResource('3');

    t.truthy(inverseUser instanceof Resource);
    t.is(inverseUser.relationship('friends').records[0].id, '1');
  } catch (err) {
    t.fail(err.message);
  }
});
