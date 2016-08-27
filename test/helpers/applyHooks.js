import { init, cleanup } from 'ava-rethinkdb';
import redink from '../../src';
import { db } from '../../src/dbSingleton';
import { schemas, initData } from '../fixtures';

export default (test) => {
  let port;

  test.before('initialize', (t) => init(initData)(t).then(p => (port = p)));

  test.before('should start the seeded singleton', t => (
    redink()
      .start({
        schemas,
        port,
        name: 'test',
        host: 'localhost',
      })
      .then(() => {
        t.truthy(db().instance().conn, 'connection is present');
      })
  ));

  test.after.always('should teardown the singleton', () => (
    db().stop().then(cleanup)
  ));
};
