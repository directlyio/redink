import * as types from '../constants/relationshipTypes';

export default (relation, inverseRelation) => (
  relation === types.HAS_MANY && (
    inverseRelation === types.BELONGS_TO ||
    inverseRelation === types.HAS_ONE
  )
);
