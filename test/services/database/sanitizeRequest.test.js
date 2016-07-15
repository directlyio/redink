import test from 'ava';
import sanitizeRequest from '../../../src/services/database/sanitizeRequest';
import { schemas } from '../../fixtures';

test('Sanitize: Sanitize request', t => {
  const schema = schemas.individual;

  t.deepEqual(sanitizeRequest(schema, {
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    phone: '3033256597',
  }), {
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
  }, 'Sanitized data');
});

test('Sanitize: Sanitize relationships', t => {
  const schema = schemas.individual;

  t.deepEqual(sanitizeRequest(schema, {
    id: 1,
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    phone: '3033256597',
    dogs: ['1', '2', '3'],
    pets: ['1', '2'],
    company: '1',
  }), {
    id: 1,
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
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
  }, 'Sanitized relationships');
});
