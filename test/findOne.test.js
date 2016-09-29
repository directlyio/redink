import test from 'ava';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should find first user', async t => {
  try {
    const user = await model('user').findOne();

    t.is(typeof user.id, 'string');
  } catch (err) {
    t.fail(err);
  }
});

test('should find billy', async t => {
  try {
    const user = await model('user').findOne({
      filter: { name: 'Billy' },
    });

    t.is(user.attribute('name'), 'Billy');
  } catch (err) {
    t.fail(err);
  }
});
