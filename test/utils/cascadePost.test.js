import test from 'ava';
import { db } from '../../src/dbSingleton';
import { schemas } from '../fixtures';

test.before('Database: Connect to database', async t => {
  await db(schemas, process.env.RETHINKDB_URL, process.env.RETHINKDB_NAME).start();
  t.truthy(db().instance().conn, 'connection is present');
});

test('Database: Cascade post', async t => {
  const post = await db().instance().create('listing', {
    company: '100',
    categories: ['112', '113'],
  });

  t.truthy(post.cascade, 'Cascade post was a success');
});

test.after.always('Database: Teardown database', async () => {
  await db().stop();
});
