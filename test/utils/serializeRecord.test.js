import test from 'ava';
import serializeRecord from '../../src/utils/serializeRecord';
import { schemas } from '../fixtures';

test('should properly serialize a single record', t => {
  const schema = schemas.individual;

  const expected = {
    id: '6',
    name: 'CJ',
    email: 'brewercalvinj@gmail.com',
    pets: [{
      id: '1',
      archived: false,
    }, {
      id: '2',
      archived: false,
    }],
    company: {
      id: '1',
    },
    meta: {
      archived: false,
    },
  };

  const serialized = serializeRecord(schema, {
    id: '6',
    name: 'CJ',
    email: 'brewercalvinj@gmail.com',
    pets: [{
      id: '1',
      archived: false,
    }, {
      id: '2',
      archived: false,
    }],
    company: {
      id: '1',
      archived: false,
    },
    meta: {
      archived: false,
    },
  });

  t.deepEqual(serialized, expected, 'Serialize relationships');
});
