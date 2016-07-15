import test from 'ava';
import addToQueue from '../../src/utils/addToQueue';

test('Test for `addToQueue`', t => {
  const properQueue = [
    {
      table: 'ad',
      id: '11110',
    },
    {
      table: 'ad',
      id: '22220',
    },
    {
      table: 'listing',
      id: '1111',
    },
    {
      table: 'listing',
      id: '2222',
    },
  ];

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

  let queue = [];

  queue = addToQueue(queue, actionObject);

  t.deepEqual(queue, properQueue);
});
