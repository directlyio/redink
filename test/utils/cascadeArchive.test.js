import test from 'ava';
import { db } from '../../src/dbSingleton';
import { schemas } from '../fixtures';
import getArchiveObject from '../../src/utils/getArchiveObject';

test.before('Database: Connect to database', async t => {
  await db(schemas, process.env.RETHINKDB_URL, process.env.RETHINKDB_NAME).start();
  t.truthy(db().instance().conn, 'connection is present');
});

test('Database: Archive', async t => {
  const properArchiveObject = {
    archive: {
      enterprise: {
        1009: true,
      },
      listing: {
        11119: true,
        22229: true,
      },
      ad: {
        111109: true,
        222209: true,
      },
    },
    patch: {
      enterprise: {
        1009: {
          listings: {
            11119: true,
            22229: true,
          },
          ads: {
            111109: true,
            222209: true,
          },
        },
      },
      listing: {
        11119: {
          company: {
            1009: true,
          },
          categories: {
            1129: true,
            1139: true,
          },
        },
        22229: {
          company: {
            1009: true,
          },
          categories: {
            1129: true,
          },
        },
      },
      ad: {
        111109: {
          company: {
            1009: true,
          },
          categories: {
            1129: true,
            1139: true,
          },
        },
        222209: {
          company: {
            1009: true,
          },
          categories: {
            1129: true,
          },
        },
      },
      category: {
        1129: {
          listings: {
            11119: true,
            22229: true,
          },
          ads: {
            111109: true,
            222209: true,
          },
        },
        1139: {
          listings: {
            11119: true,
          },
          ads: {
            111109: true,
          },
        },
      },
    },
  };

  const archiveObject = await getArchiveObject('1009', 'enterprise', schemas, db().instance().conn);

  t.deepEqual(archiveObject, properArchiveObject);

  const archive = await db().instance().archive('enterprise', '100');

  t.is(archive.deleted, true, 'Archived relationships');

  const post = await db().instance().update('listing', '11119', {
    company: {
      old: '1009',
      new: '2009',
    },
    categories: {
      old: ['1129', '1139'],
      new: ['1129'],
    },
  });

  t.truthy(post.id, 'Cascade update was a success');
});

test.after.always('Database: Teardown database', async () => {
  await db().stop();
});
