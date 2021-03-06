import * as types from './entityTypes';

export default {
  test: {
    [types.USER_TABLE]: [{
      id: '1',
      name: 'Bob',
      friends: [{
        id: '2',
        _archived: false,
        _related: true,
      }],
      company: {
        id: '1',
        _archived: false,
        _related: true,
      },
      _meta: {
        _archived: false,
      },
    }, {
      id: '2',
      name: 'Billy',
      friends: [{
        id: '1',
        _archived: false,
        _related: true,
      }],
      _meta: {
        _archived: false,
      },
    }, {
      id: '3',
      name: 'Joe',
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
    }],
    [types.COMPANY_TABLE]: [{
      id: '1',
      name: 'Apple',
      address: {
        id: '1',
        _archived: false,
        _related: true,
      },
      _meta: {
        _archived: false,
      },
    }, {
      id: '2',
      name: 'Google',
      address: {
        id: '2',
        _archived: false,
        _related: true,
      },
      _meta: {
        _archived: false,
      },
    }],
    [types.ADDRESS_TABLE]: [{
      id: '1',
      city: 'Denver',
      company: {
        id: '1',
        _archived: false,
        _related: true,
      },
      _meta: {
        _archived: false,
      },
    }, {
      id: '2',
      city: 'Grand Lake',
      company: {
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
