import { init, cleanup } from 'ava-rethinkdb';
import redink from '../../src';
import { schemas, initData } from '../fixtures';

const CLEANUP_DELAY = 500;
const stop = () => redink().disconnect();

export default (test, data = initData) => {
  let port;

  test.before('initialize', (t) => init(data)(t).then(p => (port = p)));

  test.before('should start the seeded singleton', t => (
    redink()
      .connect({
        schemas,
        port,
        db: 'test',
        host: 'localhost',
        verbose: true,
      })
      .then(() => {
        t.truthy(redink().instance().conn, 'connection is present');
      })
  ));

  test.after.always('should teardown the singleton', () => (
    new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY))
      .then(stop)
      .then(cleanup)
  ));
};
