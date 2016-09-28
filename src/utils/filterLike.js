import r from 'rethinkdb';

const { keys } = Object;

export default (filters) => {
  const key = keys(filters)[0];
  const search = filters[key];

  return (keys(filters).length === 2 && key === 'name')
    ? r.row(`${key}`).match(`^${search}`).and(r.row('meta')('archived').eq(false))
    : false;
};
