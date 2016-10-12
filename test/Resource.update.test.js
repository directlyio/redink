import test from 'ava';
import Resource from '../src/Resource';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should update a user\'s attributes', async t => {
  try {
    const user = await model('user').fetchResource('1')
      .then(userResource => (
        userResource.update({
          name: 'CJ',
          email: 'brewercalinj@gmail.com',
        })
      ));

    t.truthy(user instanceof Resource);
    t.is(user.attribute('name'), 'CJ');
    t.is(user.attribute('email'), undefined);
  } catch (err) {
    t.fail(err.message);
  }
});
