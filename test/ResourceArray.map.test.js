import test from 'ava';
import Resource from '../src/Resource';
import ResourceArray from '../src/ResourceArray';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should map over all users with a synchronous function', async t => {
  try {
    const users = await model('user').find();
    const names = users.map(user => {
      t.truthy(user instanceof Resource);
      return user.attribute('name');
    });

    t.is(names.length, 2);
    t.truthy(names.includes('Bob'));
    t.truthy(names.includes('Billy'));
    t.truthy(users instanceof ResourceArray);
  } catch (err) {
    t.fail(err);
  }
});
