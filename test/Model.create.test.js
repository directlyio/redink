import test from 'ava';
import Resource from '../src/Resource';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should create a user', async t => {
  try {
    const user = await model('user').create({
      name: 'CJ',
      blogs: [],
      friends: ['1'],
      company: '1',
    });

    t.truthy(user instanceof Resource);
  } catch (err) {
    t.fail(err.message);
  }
});

test('should fail to create a user because the company doesn\'t exist', async t => {
  try {
    await model('user').create({
      name: 'CJ',
      blogs: [],
      friends: ['1'],
      company: 'invalid',
    });
  } catch (err) {
    t.is(
      err.message,
      'Expected a valid record of type \'company\' but got invalid record with id of \'invalid\'.'
    );
  }
});
