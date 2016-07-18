import test from 'ava';
import sanitizeRequest from '../../src/utils/sanitizeRequest';
import { schemas } from '../fixtures';

test('Sanitize: Sanitize request', t => {
  const schema = schemas.individual;
  const properlySanitizedRequest = {
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    meta: {
      archived: false,
    },
  };

  const sanitizedRequest = sanitizeRequest(schema, {
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    phone: '3033256597',
  });

  t.deepEqual(sanitizedRequest, properlySanitizedRequest, 'Sanitized data');
});

test('Sanitize: Sanitize relationships', t => {
  const schema = schemas.individual;
  const properlySanitizedRequest = {
    id: '1',
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
  };

  const sanitizedRequest = sanitizeRequest(schema, {
    id: '1',
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    phone: '3033256597',
    dogs: ['1', '2', '3'],
    pets: ['1', '2'],
    company: '1',
  });

  t.deepEqual(sanitizedRequest, properlySanitizedRequest, 'Sanitized relationships');
});

test('Sanitize: Sanitize request - update', t => {
  const schema = schemas.individual;
  const properlySanitizedRequest = {
    id: '2',
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    cars: [{
      id: '1',
      archived: false,
    }, {
      id: '2',
      archived: false,
    }, {
      id: '4',
      archived: false,
    }],
    meta: {
      archived: false,
    },
  };

  const sanitizedRequest = sanitizeRequest(schema, {
    id: '2',
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    phone: '3033256597',
    shoes: {
      old: ['1', '2', '3'],
      new: ['2', '3'],
    },
    cars: {
      old: ['1', '2'],
      new: ['1', '2', '4'],
    },
  }, true);

  t.deepEqual(sanitizedRequest, properlySanitizedRequest, 'Sanitized data');
});

test('Sanitize: Relationship is not hasMany and the request specifies one record', t => {
  const schema = schemas.individual;
  const properlySanitizedRequest = {
    id: '3',
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    company: {
      id: '1',
      archived: false,
    },
    meta: {
      archived: false,
    },
  };

  const sanitizedRequest = sanitizeRequest(schema, {
    id: '3',
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    phone: '3033256597',
    albums: ['1', '2'],
    company: '1',
  });

  t.deepEqual(sanitizedRequest, properlySanitizedRequest, 'Sanitized data');
});

test('Sanitize: Relationship is hasMany, but request only specifies one record', t => {
  const schema = schemas.individual;
  const properlySanitizedRequestPost = {
    id: '4',
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    pets: [{
      id: '1',
      archived: false,
    }],
    meta: {
      archived: false,
    },
  };

  const sanitizedRequestPost = sanitizeRequest(schema, {
    id: '4',
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    phone: '3033256597',
    albums: ['1', '2'],
    pets: '1',
  });

  t.deepEqual(sanitizedRequestPost, properlySanitizedRequestPost, 'Sanitized data (post)');

  const properlySanitizedRequestPatch = {
    id: '5',
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    pets: [{
      id: '2',
      archived: false,
    }],
    meta: {
      archived: false,
    },
  };

  const sanitizedRequestPatch = sanitizeRequest(schema, {
    id: '5',
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    phone: '3033256597',
    pets: {
      old: ['1', '2'],
      new: '2',
    },
  }, true);

  t.deepEqual(sanitizedRequestPatch, properlySanitizedRequestPatch, 'Sanitized data (patch)');
});
