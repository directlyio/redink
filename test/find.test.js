import test from 'ava';
import applyHooks from './helpers/applyHooks';
import { db } from '../src/dbSingleton';

applyHooks(test);

test('should find all users', async t => {
  try {
    const users = await db().instance().find('user', {}, {});
    const expected = [{
      id: '1',
      name: 'Ben Franklin',
      pets: [{
        id: '1',
        species: 'Dog',
        owner: '1',
      }],
      company: {
        id: '1',
        name: 'Directly, Inc.',
        employees: ['1'],
      },
      planet: {
        id: '1',
        name: 'Earth',
        inhabitants: ['1'],
      },
    }];

    t.deepEqual(users, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should find all users with out sideloading', async t => {
  try {
    const users = await db().instance().find('user', {}, {
      sideload: false,
    });
    const expected = [{
      id: '1',
      name: 'Ben Franklin',
      pets: [{
        id: '1',
      }],
      company: {
        id: '1',
      },
      planet: {
        id: '1',
      },
    }];

    t.deepEqual(users, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should find a user with a filter (1)', async t => {
  try {
    const users = await db().instance().find('user', { name: 'B' }, {});
    const expected = [{
      id: '1',
      name: 'Ben Franklin',
      pets: [{
        id: '1',
        species: 'Dog',
        owner: '1',
      }],
      company: {
        id: '1',
        name: 'Directly, Inc.',
        employees: ['1'],
      },
      planet: {
        id: '1',
        name: 'Earth',
        inhabitants: ['1'],
      },
    }];

    t.deepEqual(users, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should find a user with a filter without pets', async t => {
  try {
    const users = await db().instance().find('user', { name: 'B' }, {
      sideload: {
        pets: false,
      },
      without: {
        pets: true,
      },
    });
    const expected = [{
      id: '1',
      name: 'Ben Franklin',
      company: {
        id: '1',
        name: 'Directly, Inc.',
        employees: ['1'],
      },
      planet: {
        id: '1',
        name: 'Earth',
        inhabitants: ['1'],
      },
    }];

    t.deepEqual(users, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should find a user with a filter (2)', async t => {
  try {
    const users = await db().instance().find('user', { company: '1' }, {});
    const expected = [{
      id: '1',
      name: 'Ben Franklin',
      pets: [{
        id: '1',
        species: 'Dog',
        owner: '1',
      }],
      company: {
        id: '1',
        name: 'Directly, Inc.',
        employees: ['1'],
      },
      planet: {
        id: '1',
        name: 'Earth',
        inhabitants: ['1'],
      },
    }];

    t.deepEqual(users, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should find a user with a filter (3)', async t => {
  try {
    const users = await db().instance().find('user', { name: 'George Washington' }, {});
    const expected = [];
    t.deepEqual(users, expected);
  } catch (err) {
    t.fail(err);
  }
});
