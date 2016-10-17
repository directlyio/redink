import test from 'ava';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should archive hasMany - belongsTo (user - blog) relationship', async t => {
  try {
    const blogger = await model('user').fetchResource('1');
    const blog1 = await model('blog').fetchResource('1');
    const blog2 = await model('blog').fetchResource('2');

    t.false(blogger.meta._archived);
    t.false(blog1.meta._archived);
    t.false(blog2.meta._archived);
    t.false(blog1.relationship('author').record._archived);
    t.false(blog2.relationship('author').record._archived);

    const deletedBlogger = await blogger.archive();
    const defunctBlog1 = await model('blog').fetchResource('1');
    const defunctBlog2 = await model('blog').fetchResource('2');

    t.true(deletedBlogger.meta._archived);
    t.true(defunctBlog1.meta._archived);
    t.true(defunctBlog2.meta._archived);
    t.true(defunctBlog1.relationship('author').record._archived);
    t.true(defunctBlog2.relationship('author').record._archived);
  } catch (err) {
    t.fail(err.message);
  }
});
