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

test.skip('Database: Create, read, update, delete with no relationships', async t => {
  let user;

  user = await db().instance().create('individual', {
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    meta: {
      archived: false,
    },
  });

  t.deepEqual(user, {
    id: user.id,
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    meta: {
      archived: false,
    },
    cascade: [],
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

  user = await db().instance().delete('individual', user.id);

  t.is(user.deleted, true, 'user was successfully deleted');
});

test.skip('Database: Fetch related', async t => {
  let expected;

  await db().instance().create('company', {
    id: '13',
    name: 'Apple',
    employees: [],
    meta: {
      archived: false,
    },
  });

  await db().instance().create('individual', {
    id: '10',
    name: 'Dylan',
    email: 'dylanslack@gmail.com',
    pets: [],
    company: {
      id: '13',
      archived: false,
    },
    meta: {
      archived: false,
    },
  });

  await db().instance().create('animal', {
    id: '11',
    species: 'dog',
    color: 'brown',
    owner: {
      id: '10',
      archived: false,
    },
    meta: {
      archived: false,
    },
  });

  await db().instance().create('animal', {
    id: '12',
    species: 'cat',
    color: 'black',
    owner: {
      id: '10',
      archived: false,
    },
    meta: {
      archived: false,
    },
  });

  const pets = await db().instance().fetchRelated('individual', '10', 'pets');

  expected = [{
    id: '11',
    species: 'dog',
    color: 'brown',
    owner: {
      archived: false,
      id: '10',
      name: 'Dylan',
      email: 'dylanslack@gmail.com',
      pets: [{
        id: '11',
        archived: false,
      }, {
        id: '12',
        archived: false,
      }],
      company: {
        id: '13',
        archived: false,
      },
      meta: {
        archived: false,
      },
    },
    meta: {
      archived: false,
    },
  }, {
    id: '12',
    species: 'cat',
    color: 'black',
    owner: {
      archived: false,
      id: '10',
      name: 'Dylan',
      email: 'dylanslack@gmail.com',
      pets: [{
        id: '11',
        archived: false,
      }, {
        id: '12',
        archived: false,
      }],
      company: {
        id: '13',
        archived: false,
      },
      meta: {
        archived: false,
      },
    },
    meta: {
      archived: false,
    },
  }];

  t.deepEqual(pets, expected, 'fetched pets has correct json');

  const company = await db().instance().fetchRelated('individual', '10', 'company');

  expected = {
    id: '13',
    name: 'Apple',
    employees: [{
      id: '10',
      name: 'Dylan',
      email: 'dylanslack@gmail.com',
      pets: [{
        id: '11',
        archived: false,
      }, {
        id: '12',
        archived: false,
      }],
      company: {
        id: '13',
        archived: false,
      },
      meta: {
        archived: false,
      },
    }],
    meta: {
      archived: false,
    },
  };

  t.deepEqual(company, expected, 'fetched company has correct json');
});

test.skip('Merge: Merge relationships with complete relationships', async t => {
  await r.table(companyTable).insert({
    id: '1000',
    name: 'Apple',
    employees: [{
      id: '1100',
      archived: false,
    }],
    meta: {
      archived: false,
    },
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
    company: {
      archived: false,
      id: '1000',
      name: 'Apple',
      employees: [{
        id: '1100',
        archived: false,
      }],
      meta: {
        archived: false,
      },
    },
    pets: [{
      id: '1110',
      species: 'dog',
      owner: {
        id: '1100',
        archived: false,
      },
      color: 'brown',
      meta: {
        archived: false,
      },
    }, {
      id: '2200',
      species: 'cat',
      owner: {
        id: '1100',
        archived: false,
      },
      color: 'black',
      meta: {
        archived: false,
      },
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
  };

  t.deepEqual(merged, expected, 'merged object has correct json');
});

test.skip('Merge: Merge relationships with incomplete relationships', async t => {
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

test.after.always('Database: Teardown database', async () => {
  await db().stop();
});
