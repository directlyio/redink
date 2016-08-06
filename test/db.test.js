import test from 'ava';
import { db } from '../src/dbSingleton';
import { schemas } from './fixtures';

test.before('Singleton: Instance error', t => {
  try {
    db().instance();
  } catch (e) {
    t.is(e.message, 'Error in db singleton: Redink not initialized.', 'Not initialized');
  }
});

test('Singleton: Database singleton', async t => {
  await db(schemas, process.env.RETHINKDB_NAME, process.env.RETHINKDB_URL).start();

  const first = db().instance();
  const second = db().instance();

  t.true(first === second, 'both vars are the same db instance');

  await db().stop();
});
