import test from 'ava';
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

    t.truthy(typeof results.user === 'object');
    t.truthy(typeof results.company === 'object');
  } catch (err) {
    t.fail(err);
  }
});

test('should fetch a couple of resources with an alias', async t => {
  try {
    const results = await model('user:bob', 'company').map({
      bob(user) {
        return user.fetchResource('1');
      },

      company(company) {
        return company.fetchResource('1');
      },
    });

    t.truthy(typeof results.bob === 'object');
    t.truthy(typeof results.company === 'object');
  } catch (err) {
    t.fail(err);
  }
});
