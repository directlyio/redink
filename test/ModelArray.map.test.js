import test from 'ava';
import Resource from '../src/Resource';
import ResourceArray from '../src/ResourceArray';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should fetch a couple of resources', async t => {
  try {
    const results = await model('user', 'company').map({
      user(user) {
        return user.fetchResource('1');
      },

      company(company) {
        return company.fetchResource('1');
      },
    });

    t.truthy(results.user instanceof Resource);
    t.truthy(results.company instanceof Resource);
  } catch (err) {
    t.fail(err);
  }
});

test('should fetch a couple of resources with an alias', async t => {
  try {
    const results = await model('user:bob', 'company:companies').map({
      bob(user) {
        return user.fetchResource('1');
      },

      companies(company) {
        return company.find();
      },
    });

    t.truthy(results.bob instanceof Resource);
    t.truthy(results.companies instanceof ResourceArray);
  } catch (err) {
    t.fail(err);
  }
});
