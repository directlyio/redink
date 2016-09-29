import test from 'ava';
import Resource from '../src/Resource';
import ResourceArray from '../src/ResourceArray';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should find the first user\'s friends', async t => {
  try {
    const friends = await model('user').findRelated('1', 'friends');

    t.truthy(friends instanceof ResourceArray);
  } catch (err) {
    t.fail(err);
  }
});

test('should find the first user\'s company', async t => {
  try {
    const company = await model('user').findRelated('1', 'company');

    t.truthy(company instanceof Resource);
  } catch (err) {
    t.fail(err);
  }
});
