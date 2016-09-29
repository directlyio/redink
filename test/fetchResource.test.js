import test from 'ava';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should fetch a single user', async t => {
  try {
    const user = await model('user').fetchResource('1');

    t.is(user.id, '1');
  } catch (err) {
    t.fail(err);
  }
});

test('should fetch a single user with some sideloaded relationships', async t => {
  try {
    const user = await model('user').fetchResource('1', {
      include: { friends: true, company: true },
    });

    t.is(user.id, '1');
    t.is(user.relationship('friends').records[0].name, 'Billy');
    t.is(user.relationship('company').record.name, 'Apple');
  } catch (err) {
    t.fail(err);
  }
});

test('should fetch a single user with some fields plucked', async t => {
  try {
    const user = await model('user').fetchResource('1', {
      pluck: { friends: true },
      include: { friends: true, company: true },
    });

    t.is(Object.keys(user.attributes()).length, 0);
    t.is(Object.keys(user.relationships()).length, 1);
    t.is(user.id, '1');
  } catch (err) {
    t.fail(err);
  }
});
