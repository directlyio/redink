import test from 'ava';
import { db } from '../../../src/services';
import { schemas } from '../../fixtures';

test.before('Database: Connect to database', async t => {
  await db(schemas, process.env.RETHINKDB_URL, process.env.RETHINKDB_NAME).start();
  t.truthy(db().instance().conn, 'connection is present');
});

test('Database: Cascade post', async t => {
  const post = await db().instance().create('listing', {
    meta: {
      archived: false,
    },
    company: {
      id: '100',
      archived: false,
    },
    categories: [
      {
        id: '112',
        archived: false,
      },
      {
        id: '113',
        archived: false,
      },
    ],
  });

  t.truthy(post.cascade, 'Cascade post was a success');
});

test.after.always('Database: Teardown database', async () => {
  await db().stop();
});
