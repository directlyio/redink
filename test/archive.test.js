import test from 'ava';
import applyHooks from './helpers/applyHooks';
import { db } from '../src/dbSingleton';

applyHooks(test);

test('archive first user', async t => {
  try {
    const animalsBefore = await db().instance().find('animal');
    t.is(animalsBefore.length, 1);

    const status = await db().instance().archive('user', '1');
    t.truthy(status);

    const animalsAfter = await db().instance().find('animal');
    t.is(animalsAfter.length, 0);
  } catch (err) {
    t.fail(err);
  }
});
