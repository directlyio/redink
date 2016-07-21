import test from 'ava';
import { db } from '../../src/dbSingleton';
import { schemas } from '../fixtures';

test.before('Database: Connect to database', async t => {
  await db(schemas, process.env.RETHINKDB_URL, process.env.RETHINKDB_NAME).start();
  t.truthy(db().instance().conn, 'connection is present');
});

test('Database: Cascade update hasOne', async t => {
  const post = await db().instance().create('head', {
    body: '1',
  });

  const head = post.id;

  const update = await db().instance().update('head', head, {
    body: {
      old: '1',
      new: '2',
    },
  });

  t.truthy(update.id, 'Cascade update was a success');
});

test('Database: missing new field', async t => {
  const expected = "Missing old and/or new fields for 'body'.";

  const post = await db().instance().create('head', {
    body: '1',
  });

  try {
    await db().instance().update('head', post.id, {
      body: '2',
    });
  } catch (e) {
    t.is(e.message, expected, 'Missing new field');
  }
});

test('Database: missing old field', async t => {
  const expected = "Missing old and/or new fields for 'body'.";

  const post = await db().instance().create('head', {
    body: '1',
  });

  try {
    await db().instance().update('head', post.id, {
      body: {
        new: '2',
      },
    });
  } catch (e) {
    t.is(e.message, expected, 'Missing old field');
  }
});

test.after.always('Database: Teardown database', async () => {
  await db().stop();
});
