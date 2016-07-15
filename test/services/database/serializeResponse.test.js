import test from 'ava';
import serializeResponse from '../../../src/services/database/serializeResponse';
import { schemas } from '../../fixtures';

test.only('Serialize: Serialize body', t => {
  const schema = schemas.individual;

  const expected = {
    id: '6',
    name: 'CJ',
    email: 'brewercalvinj@gmail.com',
    pets: ['1', '2'],
    company: '1',
  };

  const serialized = serializeResponse(schema, {
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
