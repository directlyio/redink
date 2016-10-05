import test from 'ava';
import Resource from '../src/Resource';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should find first user', async t => {
  try {
    const user = await model('user').findOne();

    t.truthy(user instanceof Resource);
  } catch (err) {
    t.fail(err.message);
  }
});

test('should find billy', async t => {
  try {
    const user = await model('user').findOne({
      filter: { name: 'Billy' },
    });

    t.truthy(user instanceof Resource);
    t.is(user.attribute('name'), 'Billy');
  } catch (err) {
    t.fail(err.message);
  }
});
