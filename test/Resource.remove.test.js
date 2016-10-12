import test from 'ava';
import Resource from '../src/Resource';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should remove a user\'s company', async t => {
  try {
    const user = await model('user').fetchResource('1')
      .then(userResource => (
        userResource.remove('company')
      ));

    t.truthy(user instanceof Resource);
    t.is(user.relationship('company').record._related, false);
  } catch (err) {
    t.fail(err.message);
  }
});
