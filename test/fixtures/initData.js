import * as types from './entityTypes';

export default {
  test: {
    [types.USER_TABLE]: [{
      id: '1',
      name: 'Bob',
      friends: [{
        id: '2',
        archived: false,
      }],
      blogs: [{
        id: '1',
        archived: false,
      }],
      company: {
        id: '1',
        archived: false,
      },
      meta: {
        archived: false,
      },
    }, {
      id: '2',
      name: 'Billy',
      friends: [{
        id: '1',
        archived: false,
      }],
      meta: {
        archived: false,
      },
    }],
    [types.BLOG_TABLE]: [{
      id: '1',
      title: 'How to Blog',
      author: {
        id: '1',
        archived: false,
      },
      meta: {
        archived: false,
      },
    }],
    [types.COMPANY_TABLE]: [{
      id: '1',
      name: 'Apple',
      employees: [{
        id: '1',
        archived: false,
      }],
      address: {
        id: '1',
        archived: false,
      },
      meta: {
        archived: false,
      },
    }],
    [types.ADDRESS_TABLE]: [{
      id: '1',
      city: 'Denver',
      company: {
        id: '1',
        archived: false,
      },
      meta: {
        archived: false,
      },
    }],
  },
};
