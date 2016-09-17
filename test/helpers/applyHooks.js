import { init, cleanup } from 'ava-rethinkdb';
import redink from '../../src';
import { db } from '../../src/dbSingleton';
import { schemas, initData } from '../fixtures';

const CLEANUP_DELAY = 500;
const stop = () => redink().stop();

export default (test, data = initData) => {
  let port;

  test.before('initialize', (t) => init(data)(t).then(p => (port = p)));

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
    new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY))
      .then(stop)
      .then(cleanup)
  ));
};
