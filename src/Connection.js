import Node from './Node';

export default class Connection {
  constructor(conn, type, data) {
    if (!conn) {
      throw new TypeError('Argument "conn" is required to instantiate a Connection.');
    }

    if (!type) {
      throw new TypeError('Argument "type" is required to instantiate a Connection.');
    }

    if (!data) {
      throw new TypeError('Argument "data" is required to instantiate a Connection.');
    }

    this.type = type;
    this.pageInfo = data.pageInfo;
    this.totalCount = data.totalCount;

    this.edges = data.edges.map(({ node, cursor }) => ({
      node: new Node(conn, type, node),
      cursor,
    }));
  }

  first() {
    return this.edges && this.edges[0] && this.edges[0].node || null;
  }

  map(fn) {
    return this.edges.map(({ node, cursor }) => fn(node, cursor));
  }

  every(fn) {
    return this.edges.every(({ node, cursor }) => fn(node, cursor));
  }

  some(fn) {
    return this.edges.some(({ node, cursor }) => fn(node, cursor));
  }

  reduce(fn, initialValue = []) {
    return this.edges.reduce(({ node, cursor }) => fn(node, cursor), initialValue);
  }

  forEach(fn) {
    this.edges.forEach(({ node, cursor }) => fn(node, cursor));
  }
}
