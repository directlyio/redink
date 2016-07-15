import test from 'ava';
import { db } from '../../src/db';
import { schemas } from '../fixtures';

test.before('Database: Connect to database', async t => {
  await db(schemas, process.env.RETHINKDB_URL, process.env.RETHINKDB_NAME).start();
  t.truthy(db().instance().conn, 'connection is present');
});

test.skip('Database: Archive', async t => {
  const archive = await db().instance().delete('enterprise', '100');

  t.is(archive.deleted, true, 'Archived relationships');
});

test.after.always('Database: Teardown database', async () => {
  await db().stop();
});
