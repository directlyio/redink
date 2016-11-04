import r from 'rethinkdb';
import test from 'ava';
import Connection from '../src/Connection';
import Node from '../src/Node';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should find all users', async t => {
  try {
    const users = await model('user').find();

    t.truthy(users instanceof Connection);
  } catch (err) {
    t.fail(err.message);
  }
});

test('should find all users with pagination', async t => {
  try {
    const firstConnection = await model('user').find({
      page: {
        first: 1,
      },
    });

    const secondConnection = await model('user').find({
      page: {
        first: 1,
        after: firstConnection.pageInfo.endCursor,
      },
    });

    const thirdConnection = await model('user').find({
      page: {
        first: 1,
        before: secondConnection.pageInfo.startCursor,
      },
    });

    const fourthConnection = await model('user').find({
      page: {
        last: 1,
      },
    });

    const fifthConnection = await model('user').find({
      page: {
        after: firstConnection.pageInfo.endCursor,
        before: fourthConnection.pageInfo.startCursor,
      },
    });

    t.falsy(firstConnection.pageInfo.hasPreviousPage);
    t.truthy(firstConnection.pageInfo.hasNextPage);

    t.truthy(secondConnection.pageInfo.hasPreviousPage);
    t.truthy(secondConnection.pageInfo.hasNextPage);

    t.falsy(thirdConnection.pageInfo.hasPreviousPage);
    t.truthy(thirdConnection.pageInfo.hasNextPage);
    t.is(firstConnection.edges[0].node.id, thirdConnection.edges[0].node.id);

    t.truthy(fourthConnection.pageInfo.hasPreviousPage);
    t.falsy(fourthConnection.pageInfo.hasNextPage);

    t.truthy(fifthConnection.pageInfo.hasPreviousPage);
    t.truthy(fifthConnection.pageInfo.hasNextPage);
  } catch (err) {
    t.fail(err.message);
  }
});

test('should find users with merged relationships', async t => {
  try {
    const users = await model('user').find({
      include: {
        friends: true,
        company: true,
        blogs: true,
      },
    });

    t.truthy(users instanceof Connection);

    users.forEach(user => {
      t.truthy(user instanceof Node);

      if (user.relationships.blogs.data) {
        t.truthy(user.retrieve('blogs') instanceof Connection);
      }

      if (user.relationships.friends.data) {
        t.truthy(user.retrieve('friends') instanceof Connection);
      }

      if (user.relationships.company.data) {
        t.truthy(user.retrieve('company') instanceof Node);
      }
    });
  } catch (err) {
    t.fail(err.message);
  }
});

test('should work with filtering', async t => {
  try {
    const users = await model('user').find({
      filter: r.row('name').eq('Billy'),
    });

    t.truthy(users instanceof Connection);
    t.is(users.totalCount, 1);
    t.falsy(users.pageInfo.hasNextPage);
    t.falsy(users.pageInfo.hasPreviousPage);
  } catch (err) {
    t.fail(err.message);
  }
});
