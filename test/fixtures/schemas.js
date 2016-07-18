export default {
  user: {
    attributes: {
      name: true,
      email: true,
      password: true,
      role: true,
    },
  },
  individual: {
    attributes: {
      name: true,
      email: true,
      meta: true,
    },
    relationships: {
      company: {
        belongsTo: 'company',
        inverse: 'employees',
      },
      pets: {
        hasMany: 'animal',
        inverse: 'owner',
      },
      cars: {
        hasMany: 'car',
        embedded: true,
      },
    },
  },
  person: {
    attributes: {
      name: true,
      email: true,
      phone: true,
      job: true,
      meta: true,
    },
  },
  car: {
    attributes: {
      type: true,
      color: true,
    },
  },
  dummy: {
    attributes: {
      email: true,
      password: true,
      name: true,
      role: true,
      meta: true,
    },
  },
  company: {
    attributes: {
      name: true,
      meta: true,
    },
    relationships: {
      employees: {
        hasMany: 'individual',
        inverse: 'company',
      },
    },
  },
  animal: {
    attributes: {
      species: true,
      color: true,
      meta: true,
    },
    relationships: {
      owner: {
        belongsTo: 'individual',
        inverse: 'pets',
      },
    },
  },
  brand: {
    attributes: {
      name: true,
      image: true,
      background: true,
      text: true,
      secondary: true,
      meta: true,
    },
    relationships: {
      forms: {
        hasMany: 'form',
        inverse: 'brand',
      },
    },
  },
  form: {
    attributes: {
      name: true,
      published: true,
      meta: true,
    },
    relationships: {
      brand: {
        belongsTo: 'brand',
        inverse: 'forms',
      },
      fields: {
        hasMany: 'field',
        embedded: true,
      },
      data: {
        hasMany: 'data',
        inverse: 'form',
      },
    },
  },
  data: {
    attributes: {
      meta: true,
    },
    relationships: {
      fields: {
        hasMany: 'field',
        embedded: true,
      },
      form: {
        belongsTo: 'form',
        inverse: 'data',
      },
    },
  },
  enterprise: {
    attributes: {
      name: true,
      meta: true,
    },
    relationships: {
      listings: {
        hasMany: 'listing',
        inverse: 'company',
      },
      ads: {
        hasMany: 'ad',
        inverse: 'company',
      },
      employees: {
        hasMany: 'employee',
        inverse: 'company',
      },
    },
  },
  listing: {
    attributes: {
      meta: true,
    },
    relationships: {
      company: {
        belongsTo: 'enterprise',
        inverse: 'listings',
      },
      categories: {
        hasMany: 'category',
        inverse: 'listings',
      },
    },
  },
  ad: {
    attributes: {
      name: true,
      meta: true,
    },
    relationships: {
      company: {
        belongsTo: 'enterprise',
        inverse: 'ads',
      },
      categories: {
        hasMany: 'category',
        inverse: 'ads',
      },
    },
  },
  employee: {
    attributes: {
      name: true,
      meta: true,
    },
    relationships: {
      company: {
        belongsTo: 'enterprise',
        inverse: 'employees',
      },
    },
  },
  obg: {
    attributes: {
      name: true,
      meta: true,
    },
    relationships: {
      categories: {
        hasMany: 'category',
        inverse: 'obg',
      },
    },
  },
  category: {
    attributes: {
      name: true,
      meta: true,
    },
    relationships: {
      obg: {
        belongsTo: 'obg',
        inverse: 'categories',
      },
      listings: {
        hasMany: 'listing',
        inverse: 'categories',
      },
      ads: {
        hasMany: 'ad',
        inverse: 'categories',
      },
    },
  },
  body: {
    attributes: {
      person: true,
      meta: true,
    },
    relationships: {
      head: {
        hasOne: 'head',
        inverse: 'body',
      },
    },
  },
  head: {
    attributes: {
      meta: true,
    },
    relationships: {
      body: {
        belongsTo: 'body',
        inverse: 'head',
      },
    },
  },
};
