import test from 'ava';
import r from 'rethinkdb';
import redink, { create, update, fetch, find, archive } from '../../src';

const schemas = {
  user: {
    attributes: {
      name: true,
      meta: true,
    },
    relationships: {
      blogs: {
        hasMany: 'blog',
        inverse: 'user',
      },
      accounts: {
        hasMany: 'account',
        inverse: 'users',
      },
      admin: {
        belongsTo: 'admin',
        inverse: 'user',
      },
    },
  },
  blog: {
    attributes: {
      name: true,
      meta: true,
    },
    relationships: {
      comments: {
        hasMany: 'comment',
        inverse: 'blog',
      },
      user: {
        belongsTo: 'user',
        inverse: 'blogs',
      },
    },
  },
  account: {
    attributes: {
      name: true,
      meta: true,
    },
    relationships: {
      users: {
        hasMany: 'user',
        inverse: 'accounts',
      },
    },
  },
  comment: {
    attributes: {
      content: true,
      meta: true,
    },
    relationships: {
      blog: {
        belongsTo: 'blog',
        inverse: 'comments',
      },
    },
  },
  admin: {
    attributes: {
      title: true,
      meta: true,
    },
    relationships: {
      user: {
        hasOne: 'user',
        inverse: 'admin',
      },
    },
  },
};

test('Integration tests', async t => {
  const db = redink();

  const options = {
    host: process.env.RETHINKDB_URL,
    name: 'redink',
    schemas,
  };

  const conn = await db.start(options);

  t.truthy(conn, 'Redink started');

  await r.do([
    r.db('redink').table('user').delete(),
    r.db('redink').table('blog').delete(),
    r.db('redink').table('account').delete(),
    r.db('redink').table('comment').delete(),
    r.db('redink').table('admin').delete(),
  ]).run(conn);

  const admin1 = await create('admin', { title: 'Boss' });

  t.truthy(admin1.id, 'Created admin');

  const admin2 = await create('admin', { title: 'Trot' });

  t.truthy(admin2.id, 'Created admin');

  const user1 = await create('user', {
    name: 'CJ Brewer',
    admin: admin1.id,
    blogs: [],
    accounts: [],
  });

  t.truthy(user1.admin.id, 'Created user');

  const user2 = await create('user', {
    name: 'Dylan Slack',
    admin: admin2.id,
    blogs: [],
    accounts: [],
  });

  t.truthy(user2.admin.id, 'Created user');

  const blog1 = await create('blog', {
    name: 'Blog 1',
    user: user1.id,
    comments: [],
  });

  t.truthy(blog1.user.id, 'Created blog');

  const blog2 = await create('blog', {
    name: 'Blog 2',
    user: user2.id,
    comments: [],
  });

  t.truthy(blog2.user.id, 'Created blog');

  const comment = await create('comment', {
    content: 'I am a comment',
    blog: blog1.id,
  });

  t.truthy(comment.blog.id, 'Created blog');

  const account = await create('account', {
    name: 'Main account',
    users: [user1.id, user2.id],
  });

  t.truthy(account.users, 'Created blog');

  const updateBlog = await update('blog', blog2.id, {
    user: {
      old: user2.id,
      new: user1.id,
    },
  });

  t.is(updateBlog.user.id, user1.id, 'Updated a blog');

  const fetchUser = await fetch('user', user1.id);

  t.truthy(fetchUser.blogs[1], 'Fetched the correct user');

  const findBlogs = await find('blog', { user: { id: user1.id } });

  t.truthy((findBlogs.length === 2), 'Found all the blogs');

  const archiveUser = await archive('user', user1.id);

  t.truthy(archiveUser.deleted, 'Archived the user and relationships');

  const findAllUsers = await find('user');

  const stopDB = await db.stop();

  t.truthy((findAllUsers.length > 0), 'message');

  t.truthy(stopDB, 'Stopped redink');
});
