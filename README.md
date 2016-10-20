# Redink
RethinkDB ORM

[![CircleCI](https://circleci.com/gh/directlyio/redink.svg?style=svg)](https://circleci.com/gh/directlyio/redink)
[![codecov](https://codecov.io/gh/directlyio/redink/branch/master/graph/badge.svg)](https://codecov.io/gh/directlyio/redink)

## Installation
```sh
$ npm install redink
$ npm install redink-schema
```

## Define schemas
```js
import schema, { hasMany, hasOne, belongsTo } from 'redink-schema';

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

# API
Comprehensive documentation coming soon. The following examples assume that Redink has already been
connected.

## Model
The Model is Redink's entry point, and it exposes methods for creating and retrieving Resources.

### .fetchResource(id, options = {}) -> Resource `async`
Fetches the resource with id `id`.

```js
import { model } from 'redink';

model('user').fetchResource('1', {
  include: { blogs: true },
  without: { password: true },
}).then(user => {
  // Resource
});
```

### .find(options = {}) -> ResourceArray `async`
Finds resources that match the `options` criteria.

```js
import { model } from 'redink';

model('user').find({
  filter: r.row('age').gt(10),
  without: { password: true },

  // merge the `pets` and `blogs` relationships, but limit the blogs to 25 and only get the ones
  // with 'javascript' in the title
  include: {
    pets: true,
    blogs: {
      filter: r.row('title').contains('javascript'),
      limit: 25,
    },
  },
}).then(users => {
  // ResourceArray
});
```

### .findOne(options = {}) -> Resource
Finds the first resource that matches the `options` criteria.

```js
import { model } from 'redink';

model('user').findOne({
  filter: r.row('name').contains('smith'),
  include: { blogs: true },
}).then(user => {
  // Resource
})
```

### .findByIndex(index, value, options = {}) -> ResourceArray `async`
Finds resources that match `value` using an index.

```js
import { model } from 'redink';

// roughly equivalent to r.table('user').getAll(20, { index: 'age' })
model('user').findByIndex('age', 20).then(users => {
  // ResourceArray
});
```

### .findOneByIndex(index, value, options = {}) -> Resource `async`
Finds the first resource that matches `value` using an index.

```js
import { model } from 'redink';

model('user').findOneByIndex('email', 'johndoe@gmail.com').then(user => {
  // Resource
});
```

### .findRelated(id, relationship, options = {}) -> Resource|ResourceArray `async`
Finds either a resource or resource array that's related by `relationship`.

```js
import { model } from 'redink';

model('user').findRelated('1', 'company').then(company => {
  // Resource
});

model('user').findRelated('1', 'blogs').then(blogs => {
  // ResourceArray
});
```

### .create(record, options = {}) -> Resource `async`
Creates a resource. The relationships in `record` must be an array of ids or a single id.

```js
import { model } from 'redink';

model('user').create({
  name: 'Von Miller',
  email: 'mvp@gmail.com',
  createdOn: Date.now(),
  company: '1',
  tags: ['1', '2', '3'],
}).then(user => {
  // Resource
});
```

## ModelArray
If multiple arguments are present in `model`, Redink will return a ModelArray that can be mapped
over. The value following a colon in an argument is interpreted as an alias, which is expected to
be the key name in the argument of `map`.

```js
import { model } from 'redink';

model('teacher', 'student:students').map({
  teacher(model) {
    // model === model('teacher')
    return model.fetchResource('1');
  },

  students(model) {
    // model === model('student')
    return model.find({
      filter: r.row('grade').gt(9).and(r.row('gpa').gt(3.7)),
    });
  },
}).then(results => {
  const teacher = results.teacher; // Resource
  const students = results.students; // ResourceArray

  return teacher.push('students', students);
}).then(teacher => {
  // Resource
});
```

## Resource
Unlike a Model, which describes the appearance of a RethinkDB document, a Resource is an abstraction
over an actual, existing document.

### .update(fields, options = {}) -> Resource `async`
Updates attributes of a resource.

```js
import { model } from 'redink';

model('user').fetchResource('1').then(user => {
  return user.update({
    name: 'Demarcus Ware',
    age: user.attribute('age') + 1,
  });
}).then(user => {
  // Resource
});
```

### .fetch(relationship, options = {}) -> Resource|ResourceArray `async`
Retrieves the resources related by `relationship`.

```js
import { model } from 'redink';

model('user').fetchResource('1').then(user => {
  return user.fetch('blogs');
}).then(blogs => {
  // ResourceArray
});
```

### .put(relationship, data, options = {}) -> Resource `async`
Updates the resource's `hasOne` relationship. The `data` argument is either a string id or a
Resource.

```js
import { model } from 'redink';

model('user').fetchResource('1').then(user => {
  return user.put('company', '1');
}).then(user => {
  // Resource
});
```

### .remove(relationship, options = {}) -> Resource `async`
Removes the resource's `hasOne` relationship.

```js
import { model } from 'redink';

model('user').fetchResource('1').then(user => {
  return user.remove('company', '1');
}).then(user => {
  // Resource
});
```

### .push(relationship, data, options = {}) -> Resource `async`
Appends data to the resource's `hasMany` relationship. The `data` argument is either an array of
string ids or a ResourceArray.

```js
import { model } from 'redink';

model('user').fetchResource('1').then(user => {
  return user.push('pets', ['1', '2']);
}).then(user => {
  const newPets = user.relationship('pets'); // will include pets with ids '1' and '2'
});

model('user', 'animal:pets').map({
  user(model) {
    return model.fetchResource('1');
  },
  pets(model) {
    return model.find({ filter: { name: 'Lassy' } }),
  },
}).then(results => {
  const { user, pets } = results;
  return user.push('pets', pets);
}).then(user => {
  const newPets = user.relationship('pets'); // will include pets with name of 'Lassy'
});
```

### .splice(relationship, data, options = {}) -> Resource `async`
Removes data from the resource's `hasMany` relationship. The `data` argument is either an array of
string ids or a ResourceArray.

```js
import { model } from 'redink';

model('user').fetchResource('1').then(user => {
  return user.splice('pets', ['1', '2']);
}).then(user => {
  const newPets = user.relationship('pets'); // will not include pets with ids '1' and '2'
});

model('user', 'animal:pets').map({
  user(model) {
    return model.fetchResource('1');
  },
  pets(model) {
    return model.find({ filter: { name: 'Lassy' } }),
  },
}).then(results => {
  const { user, pets } = results;
  return user.splice('pets', pets);
}).then(user => {
  const newPets = user.relationship('pets'); // will not include any pets with the name 'Lassy'
});
```
