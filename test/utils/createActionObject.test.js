import test from 'ava';
import { schemas } from '../fixtures';
import createActionObject from '../../src/utils/createActionObject';

test('Test for `createActionObject`', t => {
  const currentTable = 'enterprise';
  const record = {
    ads: [
      {
        archived: false,
        id: '11110',
      },
      { archived: false,
        id: '22220',
      },
    ],
    id: '100',
    listings: [
      {
        archived: false,
        id: '1111',
      },
      { archived: false,
        id: '2222',
      },
    ],
    meta: { archived: false },
    name: 'Company 1',
  };

  const properActionObject = {
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

  const actionObject = createActionObject(record, currentTable, schemas);

  t.deepEqual(actionObject, properActionObject);
});
