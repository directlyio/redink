import * as types from './entityTypes';

export default {
  test: {
    [types.USER_TABLE]: [{
      id: '1',
      name: 'Ben Franklin',
      meta: {
        archived: false,
      },
    }, {
      id: '2',
      name: 'George Washington',
      meta: {
        archived: false,
      },
    }, {
      id: '3',
      name: 'Thomas Jefferson',
      meta: {
        archived: false,
      },
    }],
  },
};
