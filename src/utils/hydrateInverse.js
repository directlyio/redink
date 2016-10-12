/**
 * Hydrates the schema with type `type` with the appropriate inverse relationships by looking up
 * related schemas.
 *
 * @private
 * @param {Object} schemas - Redink schemas.
 * @param {String} type - The type of the schema whose inverse is to be hydrated.
 */
export default (schemas, type) => {
  const invalidSchemaError = (schemaType) => new Error(
    `Tried hydrating the '${schemaType}' schema's relationships' inverses, but there was no ` +
    `schema with type '${schemaType}'.`
  );

  if (!schemas[type]) {
    throw invalidSchemaError(type);
  }

  const { relationships } = schemas[type];

  Object.keys(relationships).forEach(field => {
    const { inverse, type: relatedType } = relationships[field];
    const relatedSchema = schemas[relatedType];

    if (!inverse) {
      throw new Error(
        `Tried to hydrate the inverses on the '${type}' schema, but the inverse was not defined ` +
        `for the '${field}' relationship.`
      );
    }

    if (!inverse.field) return;

    if (!relatedSchema) {
      throw invalidSchemaError(relatedType);
    }

    const {
      field: inverseField,
      relation: inverseRelation,
      type: inverseType,
    } = relatedSchema.relationships[inverse.field];

    // eslint-disable-next-line
    schemas[type].relationships[field].inverse = {
      type: inverseType,
      field: inverseField,
      relation: inverseRelation,
    };
  });
};
