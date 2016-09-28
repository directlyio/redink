import test from 'ava';
import applyHooks from './helpers/applyHooks';
import { db } from '../src/dbSingleton';
import { message as invalidRelationshipType } from '../src/errors/invalidRelationshipType';

applyHooks(test);

test('should find the user\'s `hasOne` relationship', async t => {
  try {
    const company = await db().instance().fetchRelated('user', '1', 'company');
    const expected = {
      id: '1',
      name: 'Directly, Inc.',
      employees: [{
        id: '1',
        name: 'Ben Franklin',
        company: '1',
        pets: ['1'],
        planet: '1',
      }],
    };

    t.deepEqual(company, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should find the user\'s `belongsTo` relationship', async t => {
  try {
    const planet = await db().instance().fetchRelated('user', '1', 'planet');
    const expected = {
      id: '1',
      name: 'Earth',
      inhabitants: [{
        id: '1',
        name: 'Ben Franklin',
        company: '1',
        pets: ['1'],
        planet: '1',
      }],
    };

    t.deepEqual(planet, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should find the user\'s `hasMany` relationship', async t => {
  try {
    const pets = await db().instance().fetchRelated('user', '1', 'pets');
    const expected = [{
      id: '1',
      species: 'Dog',
      owner: {
        id: '1',
        name: 'Ben Franklin',
        company: '1',
        pets: ['1'],
        planet: '1',
      },
    }];

    t.deepEqual(pets, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should find the user\'s `hasMany` relationship with a filter (1)', async t => {
  try {
    const pets = await db().instance().fetchRelated('user', '1', 'pets', {
      species: 'Dog',
    });

    const expected = [{
      id: '1',
      species: 'Dog',
      owner: {
        id: '1',
        name: 'Ben Franklin',
        company: '1',
        pets: ['1'],
        planet: '1',
      },
    }];

    t.deepEqual(pets, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should find the user\'s `hasMany` relationship with a filter (2)', async t => {
  try {
    const pets = await db().instance().fetchRelated('user', '1', 'pets', {
      species: 'Zebra',
    });

    const expected = [];

    t.deepEqual(pets, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should fail to fetch an invalid relationship', async t => {
  try {
    await db().instance().fetchRelated('user', '1', 'invalid');
    t.fail();
  } catch (err) {
    t.is(err.message, invalidRelationshipType('user', 'invalid'));
  }
});
