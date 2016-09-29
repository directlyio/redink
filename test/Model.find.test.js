import test from 'ava';
import ResourceArray from '../src/ResourceArray';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should find all users', async t => {
  try {
    const users = await model('user').find();

    t.truthy(users instanceof ResourceArray);
    t.is(users.size(), 2);
    t.is(users.first().id, '1');
    t.is(users.last().id, '2');
  } catch (err) {
    t.fail(err);
  }
});

test('should find users with options', async t => {
  try {
    const users = await model('user').find({
      filter: { name: 'Bob' },
      include: { company: true, friends: true },
    });

    t.truthy(users instanceof ResourceArray);
    t.is(users.first().relationship('friends').records[0].name, 'Billy');
    t.is(users.first().relationship('company').record.name, 'Apple');
    t.is(users.size(), 1);
  } catch (err) {
    t.fail(err);
  }
});
