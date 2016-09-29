import test from 'ava';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should fetch a single user', async t => {
  try {
    const user = await model('user').fetchResource('1');

    t.is(user.id, '1');
  } catch (err) {
    t.fail(err);
  }
});
