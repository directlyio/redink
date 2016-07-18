import redink from '../src';
import test from 'ava';
import { schemas } from './fixtures';

const {
  RETHINKDB_URL: host,
  RETHINKDB_NAME: name,
} = process.env;

const options = {
  host,
  name,
  schemas,
};

test('Start redink', async t => {
  t.truthy(await redink().start(options), 'Redink started');

  t.truthy(await redink().stop(), 'Redink stopped');
});
