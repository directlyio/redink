import test from 'ava';
import r from 'rethinkdb';
import { db } from '../src/dbSingleton';
import { schemas } from './fixtures';
import getFieldsToMerge from '../src/utils/getFieldsToMerge';

const userTable = 'individual';
const animalTable = 'animal';
const companyTable = 'company';

test.before('Database: Connect to database', async t => {
  await db(schemas, process.env.RETHINKDB_URL, process.env.RETHINKDB_NAME).start();
  t.truthy(db().instance().conn, 'connection is present');

  let table;

  table = await db().instance().clearTable('individual');
  table = await db().instance().clearTable('company');
  table = await db().instance().clearTable('animal');

  t.is(table, true, 'Cleared the tables');
});

test('Database: Create, read, update, delete with no relationships', async t => {
  let user;

  user = await db().instance().create('individual', {
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
  });

  t.deepEqual(user, {
    id: user.id,
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    meta: {
      archived: false,
    },
  }, 'created user has correct json');

  user = await db().instance().fetch('individual', user.id);

  t.deepEqual(user, {
    id: user.id,
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    meta: {
      archived: false,
    },
  }, 'fetched user has correct json');

  user = await db().instance().update('individual', user.id, {
    name: 'Dy-lon',
  });

  t.deepEqual(user, {
    id: user.id,
    name: 'Dy-lon',
    email: 'dylanslack@gmail.com',
    meta: {
      archived: false,
    },
  }, 'updated user has correct json');

  user = await db().instance().archive('individual', user.id);

  t.truthy(user.id, 'user was successfully deleted');
});

test('Merge: Merge relationships with complete relationships', async t => {
  await r.table(companyTable).insert({
    id: '1000',
    name: 'Apple',
    meta: {
      archived: false,
    },
    employees: [{
      id: '1100',
      archived: false,
    }],
  }).run(db().instance().conn);

  await r.table(userTable).insert({
    id: '1100',
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    company: {
      id: '1000',
      archived: false,
    },
    pets: [{
      id: '1110',
      archived: false,
    }, {
      id: '2200',
      archived: false,
    }],
    cars: [
      {
        id: '1',
        type: 'Ferrari',
        color: 'red',
      },
    ],
    meta: {
      archived: false,
    },
  }).run(db().instance().conn);

  await r.table(animalTable).insert([{
    id: '1110',
    species: 'dog',
    color: 'brown',
    owner: {
      id: '1100',
      archived: false,
    },
    meta: {
      archived: false,
    },
  }, {
    id: '2200',
    species: 'cat',
    color: 'black',
    owner: {
      id: '1100',
      archived: false,
    },
    meta: {
      archived: false,
    },
  }]).run(db().instance().conn);

  const merged = await r.table('individual')
    .get('1100')
    .merge(getFieldsToMerge(schemas, 'individual'))
    .run(db().instance().conn);

  const expected = {
    id: '1100',
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    meta: {
      archived: false,
    },
    company: {
      archived: false,
      id: '1000',
      name: 'Apple',
      meta: {
        archived: false,
      },
      employees: [{
        id: '1100',
        archived: false,
      }],
    },
    pets: [{
      id: '1110',
      species: 'dog',
      owner: {
        id: '1100',
        archived: false,
      },
      meta: {
        archived: false,
      },
      color: 'brown',
    }, {
      id: '2200',
      species: 'cat',
      owner: {
        id: '1100',
        archived: false,
      },
      meta: {
        archived: false,
      },
      color: 'black',
    }],
    cars: [
      {
        id: '1',
        type: 'Ferrari',
        color: 'red',
      },
    ],
  };

  t.deepEqual(merged, expected, 'merged object has correct json');
});

test('Merge: Merge relationships with incomplete relationships', async t => {
  await r.table(companyTable).insert({
    id: '2000',
    name: 'IBM',
    employees: [],
    meta: {
      archived: false,
    },
  }).run(db().instance().conn);

  await r.table(userTable).insert({
    id: '2000',
    name: 'Bobby',
    email: 'bobby@gmail.com',
    company: {
      id: '2000',
      archived: false,
    },
    meta: {
      archived: false,
    },
  }).run(db().instance().conn);

  const merged = await r.table('individual')
    .get('2000')
    .merge(getFieldsToMerge(schemas, 'individual'))
    .run(db().instance().conn);

  const expected = {
    id: '2000',
    name: 'Bobby',
    email: 'bobby@gmail.com',
    company: {
      archived: false,
      id: '2000',
      name: 'IBM',
      employees: [],
      meta: {
        archived: false,
      },
    },
    meta: {
      archived: false,
    },
  };

  t.deepEqual(merged, expected, 'merged object has correct json');
});

test('Merge: Merge relationships with no relationships', async t => {
  await r.table('user').insert({
    id: '12',
    name: 'CJ',
    email: 'brewercalvinj@gmail.com',
    password: 'password',
    role: '1',
    meta: {
      archived: false,
    },
  }).run(db().instance().conn);


  const merged = await r.table('user')
    .get('12')
    .merge(getFieldsToMerge(schemas, 'user'))
    .run(db().instance().conn);

  const expected = {
    id: '12',
    name: 'CJ',
    email: 'brewercalvinj@gmail.com',
    password: 'password',
    role: '1',
    meta: {
      archived: false,
    },
  };

  t.deepEqual(merged, expected, 'merged object has correct json');
});

test.after.always('Database: Teardown database', async () => {
  await db().stop();
});
