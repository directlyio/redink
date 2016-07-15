import test from 'ava';
import { db } from '../../src/services';
import { schemas } from '../fixtures';

test('Singleton: Database singleton', t => {
  db(schemas, process.env.RETHINKDB_URL, process.env.RETHINKDB_NAME).start();

  const first = db().instance();
  const second = db().instance();

  t.true(first === second, 'both vars are the same db instance');
});
