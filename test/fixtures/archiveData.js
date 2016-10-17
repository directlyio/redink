import * as types from './entityTypes';

export default {
  test: {
    [types.USER_TABLE]: [{
      id: '1',
      name: 'John',
      friends: [],
      _meta: {
        _archived: false,
      },
    }, {
      id: '2',
      name: 'Jane',
      friends: [],
      _meta: {
        _archived: false,
      },
    }],
    [types.BLOG_TABLE]: [{
      id: '1',
      title: 'How to Blog',
      author: {
        id: '1',
        _archived: false,
        _related: true,
      },
      _meta: {
        _archived: false,
      },
    }, {
      id: '2',
      title: 'It Came from the Blog',
      author: {
        id: '1',
        _archived: false,
        _related: true,
      },
      _meta: {
        _archived: false,
      },
    }, {
      id: '3',
      title: 'Bloggy Bottom Boys',
      author: {
        id: '2',
        _archived: false,
        _related: true,
      },
      _meta: {
        _archived: false,
      },
    }],
  },
};
