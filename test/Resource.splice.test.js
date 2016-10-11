import test from 'ava';
import Resource from '../src/Resource';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should splice a user\'s friends with id \'2\'', async t => {
  try {
    const user = await model('user')
      .fetchResource('1')
      .then(userResource => (
        userResource.splice('friends', '2')
      ));

    t.truthy(user instanceof Resource);
    t.is(user.relationship('friends').records[0]._related, false);

    const inverseUser = await model('user')
      .fetchResource('2');

    t.truthy(inverseUser instanceof Resource);
    t.is(inverseUser.relationship('friends').records[0]._related, false);
  } catch (err) {
    t.fail(err.message);
  }
});
