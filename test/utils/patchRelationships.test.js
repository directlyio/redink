import test from 'ava';
import patchRelationships from '../../src/utils/patchRelationships';

test('Test for `patchRelationships`', t => {
  const currentTable = 'enterprise';
  const currentID = '100';
  const actionObject = {
    ads: {
      action: 'archive',
      table: 'ad',
      inverseField: 'company',
      ids: ['11110', '22220'],
    },
    listings: {
      action: 'archive',
      table: 'listing',
      inverseField: 'company',
      ids: ['1111', '2222'],
    },
  };

  const properArchiveObject = {
    archive: {
      enterprise: {
        100: true,
      },
    },
    patch: {
      enterprise: {
        100: {
          ads: {
            11110: true,
            22220: true,
          },
          listings: {
            1111: true,
            2222: true,
          },
        },
      },
      ad: {
        11110: {
          company: {
            100: true,
          },
        },
        22220: {
          company: {
            100: true,
          },
        },
      },
      listing: {
        1111: {
          company: {
            100: true,
          },
        },
        2222: {
          company: {
            100: true,
          },
        },
      },
    },
  };

  let archiveObject = {
    archive: {
      enterprise: {
        100: true,
      },
    },
    patch: {},
  };

  archiveObject = patchRelationships(archiveObject, actionObject, currentID, currentTable);

  t.deepEqual(archiveObject, properArchiveObject);
});
