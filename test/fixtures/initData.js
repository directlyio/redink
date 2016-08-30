import * as types from './entityTypes';

export default {
  test: {
    [types.ANIMAL_TABLE]: [{
      id: '1',
      species: 'Dog',
      owner: {
        id: '1',
        archived: false,
      },
      meta: {
        archived: false,
      },
    }],
    [types.COMPANY_TABLE]: [{
      id: '1',
      name: 'Directly, Inc.',
      employees: [{
        id: '1',
        archived: false,
      }],
      meta: {
        archived: false,
      },
    }],
    [types.PLANET_TABLE]: [{
      id: '1',
      name: 'Earth',
      inhabitants: [{
        id: '1',
        archived: false,
      }],
      meta: {
        archived: false,
      },
    }],
    [types.USER_TABLE]: [{
      id: '1',
      name: 'Ben Franklin',
      pets: [{
        id: '1',
        archived: false,
      }],
      company: {
        id: '1',
        archived: false,
      },
      planet: {
        id: '1',
        archived: false,
      },
      meta: {
        archived: false,
      },
    }],
  },
};
