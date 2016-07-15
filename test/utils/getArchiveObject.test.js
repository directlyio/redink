import test from 'ava';
import { db } from '../../src/db';
import { schemas } from '../fixtures';
import getArchiveObject from '../../src/utils/getArchiveObject';

test.before('Database: Connect to database', async t => {
  await db(schemas, process.env.RETHINKDB_URL, process.env.RETHINKDB_NAME).start();
  t.truthy(db().instance().conn, 'connection is present');
});

test.skip('Test for `archiveObject`', async t => {
  const properArchiveObject = {
    archive: {
      enterprise: {
        100: true,
      },
      listing: {
        1111: true,
        2222: true,
      },
      ad: {
        11110: true,
        22220: true,
      },
    },
    patch: {
      enterprise: {
        100: {
          listings: {
            1111: true,
            2222: true,
          },
          ads: {
            11110: true,
            22220: true,
          },
        },
      },
      listing: {
        1111: {
          company: {
            100: true,
          },
          categories: {
            112: true,
            113: true,
          },
        },
        2222: {
          company: {
            100: true,
          },
          categories: {
            112: true,
          },
        },
      },
      ad: {
        11110: {
          company: {
            100: true,
          },
          categories: {
            112: true,
            113: true,
          },
        },
        22220: {
          company: {
            100: true,
          },
          categories: {
            112: true,
          },
        },
      },
      category: {
        112: {
          listings: {
            1111: true,
            2222: true,
          },
          ads: {
            11110: true,
            22220: true,
          },
        },
        113: {
          listings: {
            1111: true,
          },
          ads: {
            11110: true,
          },
        },
      },
    },
  };

  const archiveObject = await getArchiveObject('100', 'enterprise', schemas, db().instance().conn);

  t.deepEqual(archiveObject, properArchiveObject);
});

test.after.always('Database: Teardown database', async () => {
  await db().stop();
});
