# Redink
RethinkDB ORM

![dink]
[dink]: http://www.dvd.net.au/movies/s/05627-2.jpg
## Installation
Install [node.js](http://nodejs.org/) Then:

```sh
$ npm install redink
```

## Overview
### Define your schemas
First we need to define our schemas.

Example schemas.js file:

```javascript
export default {
  user: {
    attributes: {
      name: true,
      email: true,
    },
    relationships: {
      blogs: {
        hasMany: 'blog',
        inverse: 'user',
      },
    },
  },
  blog: {
    attributes: {
      title: true,
      content: true,
    },
    relationships: {
      user: {
        belongsTo: 'user',
        inverse: 'blogs',
      },
    },
  },
};
```

### Connect to RethinkDB
Then we need to start the connection:

```javascript
import redink from 'redink';
import schemas from './schemas';

const db = redink();

const option = {
  host, // RethinkDB host
  name, // Name of the database to connect to
  schemas, // Imported schemas object
};

db.start(options).then(...);
```

### Redink database methods
Here is a list of redink methods

⋅⋅1) create
⋅⋅2) update
⋅⋅3) archive
⋅⋅4) find
⋅⋅5) fetch
⋅⋅6) fetchRelated

#### Create
```javascript
import { create } from 'redink';

create('user', {
  name: 'CJ',
  email: 'brewercalvinj@gmail.com',
}).then(response => {
  // response
  {
    id: '1',
    name: 'CJ',
    email: 'brewercalvinj@gmail.com',
  }
});

create('blog', {
  title: 'How to redink',
  content: 'Content of my blog',
  user: '1',
}).then(response => {
  //response
  {
    id: '2',
    title: 'How to redink',
    content: 'Content of my blog',
    user: {
      id: '1',
      name: 'CJ',
      email: 'brewercalvinj@gmail.com',
      blogs: ['2'],
    },
  }
});
```
