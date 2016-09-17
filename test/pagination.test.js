import test from 'ava';
import applyHooks from './helpers/applyHooks';
import { db } from '../src/dbSingleton';
import { paginationData } from './fixtures';

applyHooks(test, paginationData);

test('should paginate properly (1)', async t => {
  try {
    const pagination = { limit: 1 };
    const users = await db().instance().find('user', {}, pagination);
    const expected = [{
      id: '1',
      name: 'Ben Franklin',
    }];

    expected.count = 3;
    t.deepEqual(users, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should paginate properly (2)', async t => {
  try {
    const pagination = { limit: 1, skip: 1 };
    const users = await db().instance().find('user', {}, pagination);
    const expected = [{
      id: '2',
      name: 'George Washington',
    }];

    expected.count = 3;
    t.deepEqual(users, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should paginate properly (3)', async t => {
  try {
    const pagination = { skip: 2 };
    const users = await db().instance().find('user', {}, pagination);
    const expected = [{
      id: '3',
      name: 'Thomas Jefferson',
    }];

    expected.count = 3;
    t.deepEqual(users, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should paginate properly (4)', async t => {
  try {
    const pagination = { skip: 3 };
    const users = await db().instance().find('user', {}, pagination);
    const expected = [];

    expected.count = 3;
    t.deepEqual(users, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should paginate properly (5)', async t => {
  try {
    const pagination = { limit: 2 };
    const users = await db().instance().find('user', {}, pagination);
    const expected = [{
      id: '1',
      name: 'Ben Franklin',
    }, {
      id: '2',
      name: 'George Washington',
    }];

    expected.count = 3;
    t.deepEqual(users, expected);
  } catch (err) {
    t.fail(err);
  }
});
