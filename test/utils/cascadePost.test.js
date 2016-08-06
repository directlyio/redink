import test from 'ava';
import { db } from '../../src/dbSingleton';
import { schemas } from '../fixtures';

test.before('Database: Connect to database', async t => {
  await db(schemas, process.env.RETHINKDB_NAME, process.env.RETHINKDB_URL).start();
  t.truthy(db().instance().conn, 'connection is present');
});

test('Database: Cascade post', async t => {
  const post = await db().instance().create('listing', {
    company: '100',
    categories: ['112', '113'],
  });

  t.truthy(post.id, 'Cascade post was a success');
});

test('Database: Cascade post hasOne', async t => {
  const post = await db().instance().create('head', {
    body: '1',
  });

  t.truthy(post.id, 'Cascade post was a success');
});

test('Database: Cascade post to non exist record', async t => {
  const expected = "Error creating record of type 'head': " +
                   "Cascade post failed: 'body' does not exist but 'head' was created.";

  try {
    await db().instance().create('head', {
      body: '10122',
    });
  } catch (e) {
    t.is(e.message, expected, 'Body record is null');
  }
});

test.after('Database: Teardown database', async () => {
  await db().stop();
});
