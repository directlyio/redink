import test from 'ava';
import { hydrateInverse } from '../../src/utils';

const schemas = {
  user: {
    attributes: {},
    relationships: {
      blogs: {
        field: 'blogs',
        type: 'blog',
        relation: 'hasMany',
        inverse: {
          field: 'author',
          type: null,
          relation: null,
        },
      },
    },
  },
  blog: {
    attributes: {},
    relationships: {
      author: {
        field: 'author',
        type: 'user',
        relation: 'belongsTo',
        inverse: {
          field: 'blogs',
          type: null,
          relation: null,
        },
      },
    },
  },
};

const expected = {
  user: {
    attributes: {},
    relationships: {
      blogs: {
        field: 'blogs',
        type: 'blog',
        relation: 'hasMany',
        inverse: {
          field: 'author',
          type: 'user',
          relation: 'belongsTo',
        },
      },
    },
  },
  blog: {
    attributes: {},
    relationships: {
      author: {
        field: 'author',
        type: 'user',
        relation: 'belongsTo',
        inverse: {
          field: 'blogs',
          type: 'blog',
          relation: 'hasMany',
        },
      },
    },
  },
};

test('should hydrate the inverses of both schemas', t => {
  hydrateInverse(schemas, 'user');
  hydrateInverse(schemas, 'blog');

  t.deepEqual(schemas, expected);
});
