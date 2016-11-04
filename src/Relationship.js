import Connection from './Connection';
import Node from './Node';
import { hasOwnProperty } from './utils';

const isHasManyRelationshipHydrated = (data) => (
  data &&
  typeof data === 'object' &&
  Object.keys(data).includes('edges')
);

export default class Relationship {
  constructor(conn, parentSchema, field, data = null) {
    const { schema, relation, inverse } = parentSchema.relationships[field];

    this.schema = schema;
    this.field = field;
    this.relation = relation;
    this.inverse = inverse;

    if (hasOwnProperty(data, '_archived')) this._archived = data._archived;
    if (hasOwnProperty(data, '_related')) this._related = data._related;

    if (relation === 'hasMany') {
      if (isHasManyRelationshipHydrated(data)) {
        this.data = new Connection(conn, schema, data);
        this.isHydrated = true;
      } else {
        this.data = data;
        this.isHydrated = false;
      }
    } else {
      if (data) {
        this.data = new Node(conn, schema, data);
      } else {
        this.data = null;
      }
    }
  }

  requiresIndex() {
    return this.relation === 'hasMany' && (
      this.inverse.relation === 'belongsTo' ||
      this.inverse.relation === 'hasOne'
    );
  }

  isArchived() {
    return this._archived;
  }

  isRelated() {
    return this._related;
  }
}