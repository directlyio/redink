import test from 'ava';
import Resource from '../src/Resource';
import applyHooks from './helpers/applyHooks';
import { model } from '../src';

applyHooks(test);

test('should archive hasMany - belongsTo (user - blog) relationship', async t => {
  try {
    const blogger = await model('user').fetchResource('1');
    const blog = await model('blog').fetchResource('1');

    t.truthy(blogger instanceof Resource);
    t.truthy(blog instanceof Resource);

    t.false(blogger.meta._archived);
    t.false(blog.meta._archived);
    t.false(blog.relationship('author').record._archived);

    const deletedBlogger = await blogger.archive();
    const defunctBlog = await model('blog').fetchResource('1');

    t.true(deletedBlogger.meta._archived);
    t.true(defunctBlog.meta._archived);
    t.true(defunctBlog.relationship('author').record._archived);
  } catch (err) {
    t.fail(err.message);
  }
});
