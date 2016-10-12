# Redink
RethinkDB ORM

[![CircleCI](https://circleci.com/gh/directlyio/redink.svg?style=svg)](https://circleci.com/gh/directlyio/redink)
[![codecov](https://codecov.io/gh/directlyio/redink/branch/master/graph/badge.svg)](https://codecov.io/gh/directlyio/redink)

## Installation
```sh
$ npm install redink
```

## Define schemas
```js
import { schema, hasMany, hasOne, belongsTo } from 'redink';

export const user = schema('user', {
  attributes: {
    name: true,
    email: true,
    createdOn: true,
  },
  relationships: {
    blogs: hasMany('blog', 'author'),
    company: hasOne('company', 'employees'),
  },
});

export const blog = schema('blog', {
  attributes: {
    title: true,
    content: true,
    createdOn: true,
  },
  relationships: {
    author: belongsTo('user', 'blogs'),
  },
});

export const company = schema('company', {
  attributes: {
    name: true,
    street: true,
    city: true,
    state: true,
    zip: true,
  },
  relationships: {
    employees: hasMany('user', 'company'),
  },
});
```

## Connect
```js
import redink from 'redink';
import * as schemas from './schemas';

redink()

  // connect to the RethinkDB instance and register the schemas
  .connect({
    schemas,
    db: `${db}`,
    host: `${host}`,
    verbose: true,
  })

  // yay
  .then(() => console.log('Connected!'))

  // damn
  .catch(console.error);
```

## Simple API
Comprehensive documentation coming soon.
```js
import { model } from 'redink';

model('user').create({
  name: 'Von Miller',
  email: 'mvp@gmail.com',
  createdOn: Date.now(),
}).then(user => {
  // Resource
});

model('user').find({
  filter: { name: 'Von Miller' },
}).then(user => {
  // Resource
});
```
