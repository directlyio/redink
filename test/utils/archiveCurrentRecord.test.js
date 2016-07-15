import test from 'ava';
import archiveCurrentRecord from '../../src/utils/archiveCurrentRecord';

test('Test for `archiveCurrentRecord`', t => {
  const currentTable = 'enterprise';
  const currentID = '100';
  const properArchiveObject = {
    archive: {
      enterprise: {
        100: true,
      },
    },
    patch: {},
  };

  let archiveObject = {
    archive: {},
    patch: {},
  };

  archiveObject = archiveCurrentRecord(archiveObject, currentTable, currentID);

  t.deepEqual(archiveObject, properArchiveObject);
});
