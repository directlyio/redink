import test from 'ava';
import applyHooks from './helpers/applyHooks';

import { updateData } from './fixtures';
import { db } from '../src/dbSingleton';
import { message as missingOldIdsMessage } from '../src/errors/missingOldIds';
import { message as missingNewIdsMessage } from '../src/errors/missingNewIds';
import { message as missingOldIdMessage } from '../src/errors/missingOldId';
import { message as missingNewIdMessage } from '../src/errors/missingNewId';
import { message as nonExistingRelationshipMessage } from '../src/errors/nonExistingRelationship';

applyHooks(test, updateData);

test('should successfully update a user', async t => {
  try {
    const update = {
      name: 'Benny Franklin',
    };

    const user = await db().instance().update('user', '1', update);
    const expected = {
      id: '1',
      name: 'Benny Franklin',
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
    };

    t.deepEqual(user, expected);
  } catch (err) {
    t.fail(err);
  }
});

test('should fail to update the user\'s `hasMany` relationship (1)', async t => {
  try {
    const update = {
      name: 'Benny Franklin',
      pets: {
        old: ['1'],
      },
    };

    await db().instance().update('user', '1', update);
    t.fail();
  } catch (err) {
    t.is(err.message, missingNewIdsMessage('user', 'pets', '1'));
  }
});

test('should fail to update the user\'s `hasMany` relationship (2)', async t => {
  try {
    const update = {
      name: 'Benny Franklin',
      pets: {
        new: ['1'],
      },
    };

    await db().instance().update('user', '1', update);
    t.fail();
  } catch (err) {
    t.is(err.message, missingOldIdsMessage('user', 'pets', '1'));
  }
});

test('should fail to update the user\'s `hasMany` relationship (3)', async t => {
  try {
    const update = {
      name: 'Benny Franklin',
      pets: {
        old: ['1'],
        new: ['1', 'invalid'],
      },
    };

    await db().instance().update('user', '1', update);
    t.fail();
  } catch (err) {
    t.is(err.message, nonExistingRelationshipMessage('user', 'pets', '1'));
  }
});

test('should fail to update the user\'s `hasOne` relationship (1)', async t => {
  try {
    const update = {
      name: 'Benny Franklin',
      company: {
        old: '1',
      },
    };

    await db().instance().update('user', '1', update);
    t.fail();
  } catch (err) {
    t.is(err.message, missingNewIdMessage('user', 'company', '1'));
  }
});

test('should fail to update the user\'s `hasOne` relationship (2)', async t => {
  try {
    const update = {
      name: 'Benny Franklin',
      company: {
        new: '1',
      },
    };

    await db().instance().update('user', '1', update);
    t.fail();
  } catch (err) {
    t.is(err.message, missingOldIdMessage('user', 'company', '1'));
  }
});

test('should fail to update the user\'s `hasOne` relationship (3)', async t => {
  try {
    const update = {
      name: 'Benny Franklin',
      company: {
        old: '1',
        new: 'invalid',
      },
    };

    await db().instance().update('user', '1', update);
    t.fail();
  } catch (err) {
    t.is(err.message, nonExistingRelationshipMessage('user', 'company', '1'));
  }
});

test('should fail to update the user\'s `belongsTo` relationship', async t => {
  try {
    const update = {
      name: 'Benny Franklin',
      planet: {
        old: '1',
        new: 'invalid',
      },
    };

    await db().instance().update('user', '1', update);
    t.fail();
  } catch (err) {
    t.is(err.message, nonExistingRelationshipMessage('user', 'planet', '1'));
  }
});

test('should fail to update the company\'s `hasMany` relationship', async t => {
  try {
    const update = {
      employees: {
        old: [],
        new: ['1'],
      },
    };

    await db().instance().update('company', '2', update);
    t.fail();
  } catch (err) {
    // FIXME: strict message
    t.truthy(err);
  }
});

test('should update an animal\'s `belongsTo` relationship', async t => {
  try {
    const update = {
      owner: {
        old: '2',
        new: '1',
      },
    };

    const originalOwnerBefore = await db().instance().fetch('user', '2');
    t.deepEqual(originalOwnerBefore.pets, [{
      id: '2',
      species: 'Cat',
      owner: '2',
    }]);

    const newOwnerBefore = await db().instance().fetch('user', '1');
    t.deepEqual(newOwnerBefore.pets, [{
      id: '1',
      species: 'Dog',
      owner: '1',
    }]);

    const animal = await db().instance().update('animal', '2', update);
    t.deepEqual(animal.owner, {
      id: '1',
      name: 'Benny Franklin',
      pets: ['1', '2'],
      company: '1',
      planet: '1',
    });

    const originalOwnerAfter = await db().instance().fetch('user', '2');
    t.deepEqual(originalOwnerAfter.pets, []);

    const newOwnerAfter = await db().instance().fetch('user', '1');
    t.deepEqual(newOwnerAfter.pets, [{
      id: '1',
      species: 'Dog',
      owner: '1',
    }, {
      id: '2',
      species: 'Cat',
      owner: '1',
    }]);
  } catch (err) {
    t.fail(err);
  }
});
