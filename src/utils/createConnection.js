import r from 'rethinkdb';
import hasOwnProperty from './hasOwnProperty';
import mergeRelationships from './mergeRelationships';
import rbtoa from './rbtoa';

const indexOfDatum = (sequence, datum) => sequence.offsetsOf(datum).coerceTo('array')
  .do((offsets) => offsets.count().gt(0).branch(offsets(0), -1));

const decodeCursor = (cursor) => {
  if (!cursor) return false;

  const decoded = Buffer
    .from(String(cursor), 'base64')
    .toString('utf8')
    .split(':');

  return decoded.length === 2 && decoded;
};

const decodedCursorToDatum = (decodedCursor) => {
  if (!decodedCursor) return null;

  const [table, pkey] = decodedCursor;
  return r.tableList().contains(table).branch(r.table(table).get(pkey), null);
};

const nodeToCursor = (name, node) => r.add(
  name,
  ':',
  node.typeOf().eq('OBJECT').branch(node('id'), null),
).do(rbtoa);

const ensureNonNegative = (num, argName) => {
  if (typeof num !== 'number' || num < 0) {
    throw new Error(`Argument "${argName}" must be a non-negative integer.`);
  }
};

/**
 * @see [Relay Cursor Connections Specification]{@link https://facebook.github.io/relay/graphql/connections.htm#sec-Pagination-algorithm
 * @see [`graphql-relay-js` #103]{@link https://github.com/graphql/graphql-relay-js/issues/103}
 * @see [Original Code]{@link https://gist.github.com/migueloller/8d201d812df721018bc0f68fc5f6283b}
 */
export default (type, sequence, options = {}) => {
  const { name } = type;
  let after, before, last, first, afterIndex, beforeIndex; // eslint-disable-line
  let edges = sequence;

  edges = mergeRelationships(edges, type, options);

  if (hasOwnProperty(options, 'filter')) {
    edges = edges.filter(options.filter);
  }

  if (hasOwnProperty(options, 'pluck')) {
    // always pluck the id
    edges = edges.pluck({
      ...options.pluck,
      id: true,
    });
  }

  if (hasOwnProperty(options, 'without')) {
    // disallow forgoing the id
    edges = edges.without(Object.keys(options.without).reduce((prev, curr) => {
      if (curr === 'id') return prev;

      return {
        ...prev,
        [curr]: options.without[curr],
      };
    }, {}));
  }

  if (hasOwnProperty(options, 'page')) {
    const page = options.page;

    after = page.after;
    before = page.before;
    last = page.last;
    first = page.first;
  }

  if (typeof first !== 'number' && typeof last !== 'number') {
    first = 10;
  }

  const totalCount = edges.count();
  const decodedAfterCursor = decodeCursor(after);
  const decodedBeforeCursor = decodeCursor(before);

  if (decodedAfterCursor) {
    afterIndex = indexOfDatum(edges, decodedCursorToDatum(decodedAfterCursor));
    edges = afterIndex.ge(0).branch(
      edges.slice(afterIndex, { leftBound: 'open', rightBound: 'closed' }),
      edges,
    );
  } else {
    afterIndex = r(-1);
  }

  if (decodedBeforeCursor) {
    beforeIndex = indexOfDatum(edges, decodedCursorToDatum(decodedBeforeCursor));
    edges = beforeIndex.ge(0).branch(
      edges.slice(0, beforeIndex, { leftBound: 'closed', rightBound: 'open' }),
      edges,
    );
  } else {
    beforeIndex = r(-1);
  }

  const beforeCount = edges.count();

  if (first !== undefined) {
    const edgesCount = edges.count();
    ensureNonNegative(first, 'first');

    edges = edgesCount.gt(first).branch(
      edges.slice(0, first, { leftBound: 'closed', rightBound: 'open' }),
      edges,
    );
  }

  const actualFirst = edges.count();

  if (last !== undefined) {
    const edgesCount = edges.count();
    ensureNonNegative(last, 'last');

    edges = edgesCount.gt(last).branch(
      edges.slice(edgesCount.sub(last), { leftBound: 'closed', rightBound: 'closed' }),
      edges,
    );
  }

  const actualLast = edges.count();

  const hasPreviousPage = afterIndex.ge(0).branch(
    true,
    beforeIndex.eq(0).branch(
      false,
      actualFirst.gt(actualLast),
    ),
  );

  const hasNextPage = afterIndex.eq(totalCount.sub(1)).branch(
    false,
    beforeIndex.ge(0).branch(
      true,
      actualFirst.lt(beforeCount),
    ),
  );

  edges = edges.map((node) => ({
    node,
    cursor: nodeToCursor(name, node),
  })).coerceTo('array');

  return r({
    edges,
    totalCount,
    isConnection: true,
    pageInfo: {
      startCursor: edges.count().gt(0).branch(edges(0)('cursor'), null),
      endCursor: edges.count().gt(0).branch(edges.nth(-1)('cursor'), null),
      hasPreviousPage,
      hasNextPage,
    },
  });
};
