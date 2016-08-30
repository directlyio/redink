export default {
  user: {
    attributes: {
      name: true,
    },
    relationships: {
      pets: {
        hasMany: 'animal',
        inverse: 'owner',
      },
      company: {
        hasOne: 'company',
        inverse: 'employees',
      },
      planet: {
        belongsTo: 'planet',
        inverse: 'inhabitants',
      },
    },
  },
  animal: {
    attributes: {
      species: true,
    },
    relationships: {
      owner: {
        belongsTo: 'user',
        inverse: 'pets',
      },
    },
  },
  company: {
    attributes: {
      name: true,
    },
    relationships: {
      employees: {
        hasMany: 'user',
        inverse: 'company',
      },
    },
  },
  planet: {
    attributes: {
      name: true,
    },
    relationships: {
      inhabitants: {
        hasMany: 'user',
        inverse: 'planet',
      },
    },
  },
};
