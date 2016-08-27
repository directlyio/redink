process.env.REDINK_DEBUG = true;

import test from 'ava';
import applyHooks from './helpers/applyHooks';
import { db } from '../src/dbSingleton';

applyHooks(test);

test('archive first user', async t => {
  try {
    const status = await db().instance().archive('user', '1');
    t.truthy(status);
  } catch (err) {
    t.fail(err);
  }
});
