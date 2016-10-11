import test from 'ava';
import Resource from '../src/Resource';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should update a user\'s company to id \'2\'', async t => {
  try {
    const user = await model('user')
      .fetchResource('1')
      .then(userResource => (
        userResource.put('company', '2')
      ));

    t.truthy(user instanceof Resource);
    t.is(user.relationship('company').record.id, '2');
  } catch (err) {
    t.fail(err.message);
  }
});

test('should fail to update a company\'s address to \'2\'', async t => {
  try {
    await model('company')
      .fetchResource('1')
      .then(company => (
        company.put('address', '2')
      ));
  } catch (err) {
    t.is(
      err.message,
      'Tried calling \'put\' with \'data\' that violated Redink\'s update constraints.'
    );
  }
});
