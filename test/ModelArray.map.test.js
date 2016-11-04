import test from 'ava';
import Node from '../src/Node';
import Connection from '../src/Connection';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should fetch a couple of resources', async t => {
  try {
    const results = await model('user', 'company').map({
      user(user) {
        return user.fetch('1');
      },

      company(company) {
        return company.fetch('1');
      },
    });

    t.truthy(results.user instanceof Node);
    t.truthy(results.company instanceof Node);
  } catch (err) {
    t.fail(err.message);
  }
});

test('should fetch a couple of resources with an alias', async t => {
  try {
    const results = await model('user:bob', 'company:companies').map({
      bob(user) {
        return user.fetch('1');
      },

      companies(company) {
        return company.find();
      },
    });

    t.truthy(results.bob instanceof Node);
    t.truthy(results.companies instanceof Connection);
  } catch (err) {
    t.fail(err.message);
  }
});
