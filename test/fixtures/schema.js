import Schema, { hasMany, hasOne, belongsTo } from 'cohere';

export default new Schema()

  .defineType('address', {
    attributes: {
      city: true,
    },
    relationships: {
      company: belongsTo('company', 'address'),
    },
    meta: {
      inflection: 'addresses',
    },
  })

  .defineType('blog', {
    attributes: {
      title: true,
    },
    relationships: {
      author: belongsTo('user', 'blogs'),
    },
    meta: {
      inflection: 'blogs',
    },
  })

  .defineType('company', {
    attributes: {
      name: true,
    },
    relationships: {
      employees: hasMany('user', 'company'),
      address: hasOne('address', 'company'),
    },
    meta: {
      inflection: 'companies',
    },
  })

  .defineType('user', {
    attributes: {
      name: true,
    },
    relationships: {
      blogs: hasMany('blog', 'author'),
      friends: hasMany('user', 'friends'),
      company: hasOne('company', 'employees'),
    },
    meta: {
      inflection: 'users',
    },
  })

  .defineType('teacher', {
    attributes: {
      name: true,
    },
    relationships: {
      students: hasMany('student', 'teachers'),
    },
    meta: {
      inflection: 'teachers',
    },
  })

  .defineType('student', {
    attributes: {
      name: true,
    },
    relationships: {
      teachers: hasMany('teacher', 'students'),
    },
    meta: {
      inflection: 'students',
    },
  })

  .compile();
