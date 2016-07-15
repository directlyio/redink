import r from 'rethinkdb';

/**
 * Archive/patch a relationship in a `hasMany` relationship.
 * Sets the `archived` field to `true` in the relationship array of objects.
 * This is so the client can easily filter out the 'deleted/archived' records.
 *
 * ```
 * // example RethinkDB query
 * r.table('enterprise').get('100').update(row => ({
 *   'listings': row('listings').map(data => (
 *      r.branch(data('id').eq('1111'),
 *       {
 *         id: data('id'),
 *         archived: true,
 *       }, {
 *         id: data('id'),
 *         archived: data('archived'),
 *       })
 *   )),
 * }))
 *
 * // relationship before archive
 * {
 *   id: '100',
 *   name: 'Company 1',
 *   meta: {
 *     archived: true,
 *   },
 *   relationships: {
 *     listings: [
 *       {
 *         id: '1111',
 *         archived: false,
 *       },
 *       {
 *         id: '2222',
 *         archived: false,
 *       },
 *     ],
 *     ...
 *   },
 * }
 *
 * // relationship after archive
 * {
 *   id: '100',
 *   name: 'Company 1',
 *   meta: {
 *     archived: true,
 *   },
 *   relationships: {
 *     listings: [
 *       {
 *         id: '1111',
 *         archived: true,
 *       },
 *       {
 *         id: '2222',
 *         archived: false,
 *       },
 *     ],
 *     ...
 *   },
 * }
 * ```
 *
 * @param {String} table - The table to be selected.
 * @param {String} field - The field to parse through.
 * @param {String} tableId - The ID of the record to patch.
 * @param {String} fieldId - The ID of the relationship to archive.
 * @return {Object} - RethinkDB query.
 */
export const archiveManyRelationship = (table, field, tableId, fieldId) => (
  r.table(table).get(tableId).update(row => ({
    [field]: row(field).map(data => (
      r.branch(data('id').eq(fieldId),
        {
          id: data('id'),
          archived: true,
        }, {
          id: data('id'),
          archived: data('archived'),
        })
    )),
  }))
);

/**
 * Archive/patch a relationship that is either `belongsTo` or `hasOne`.
 * Sets the `archived` field to `true` in the relationship object.
 * This is so the client can know to filter out the 'deleted/archived' record.
 *
 * // example RethinkDB query
 * r.table('listing').get('1111').update({
 *   'company': {
 *     id: '100'
 *     archived: true,
 *   },
 * })
 *
 * // relationship before archive
 * {
 *   id: '1111',
 *   name: 'Listing 1',
 *   meta: {
 *     archived: true,
 *   },
 *   relationships: {
 *     company: {
 *       id: '100',
 *       archived: false,
 *     },
 *     ...
 *   },
 * }
 *
 * // relationship after archive
 * {
 *   id: '1111',
 *   name: 'Listing 1',
 *   meta: {
 *     archived: true,
 *   },
 *   relationships: {
 *     company: {
 *       id: '100',
 *       archived: true,
 *     },
 *     ...
 *   },
 * }
 * ```
 *
 * @param {String} table - The table to be selected.
 * @param {String} field - The field to archive.
 * @param {String} tableId - The ID of the record to patch.
 * @param {String} fieldId - The ID of the relationship to archive.
 * @return {Object} - RethinkDB query.
 */
export const archiveSingleRelationship = (table, field, tableId, fieldId) => (
  r.table(table).get(tableId).update({
    [field]: {
      id: fieldId,
      archived: true,
    },
  })
);

/**
 * Archive a single record.
 * Set the `archived` field in the `meta` object of a record to `true`.
 *
 * ```
 * // example RethinkDB query
 * r.table('enterprise').get('100').update({ meta: { archived: true } })
 *
 * // record before archive
 * {
 *   id: '100',
 *   name: 'Company 1',
 *   meta: {
 *     archived: false,
 *   },
 *   relationships: {
 *     ...
 *   },
 * }
 *
 * // record after archive
 * {
 *   id: '100',
 *   name: 'Company 1',
 *   meta: {
 *     archived: true,
 *   },
 *   relationships: {
 *     ...
 *   },
 * }
 * ```
 *
 * @param {String} table - The table to be selected.
 * @param {String} id - The ID of the record to be archived.
 * @return {Object} - RethinkDB query.
 */
export const archiveRecord = (table, id) => (
  r.table(table).get(id).update({ meta: { archived: true } })
);

/**
 * Append an ID to the inverse relationship fields array.
 * This function is for cascade post a `hasMany` relationship.
 * {@link cascadePost}
 *
 * ```
 * //example RethinkDB query
 * r.table('enterprise').get('100').update(row => ({
 *   'listings': row('listings').append(
 *     {
 *       id: '1300',
 *       archived: false,
 *     }),
 *   )
 * }))
 *
 * //record before post
 * {
 *   id: '100',
 *   name: 'Company 1',
 *   meta: {
 *     archived: false,
 *   },
 *   listings: [{
 *     id: '1100',
 *     archived: false,
 *   }, {
 *     id: '1200',
 *     archived: false,
 *   }],
 * }
 *
 * //record after post
 * {
 *   id: '100',
 *   name: 'Company 1',
 *   meta: {
 *     archived: false,
 *   },
 *   listings: [{
 *     id: '1100',
 *     archived: false,
 *   }, {
 *     id: '1200',
 *     archived: false,
 *   }, {
 *     id: '1300',
 *     archived: false,
 *   }],
 * }
 * ```
 *
 * @param  {String} table - Name of the table to update
 * @param  {String} tableId - ID of the table to update.
 * @param  {String} field - Name of the field to update.
 * @param  {String} fieldId - ID to append to the field.
 * @return {Object} - RethinkDB query.
 */
export const postRecordMany = (table, tableId, field, fieldId) => (
  r.table(table).get(tableId).update(row => ({
    [field]: row(field).append(
      {
        id: fieldId,
        archived: false,
      }),
  }))
);

/**
 * Update a `hasOne` relationship with a new record ID.
 * This function is for cascade post a `hasOne` relationship.
 * {@link cascadePost}
 *
 * ```
 * //example RethinkDB query
 * r.table('enterprise').get('100').update({
 *   'ceo': {
 *       id: '5000',
 *       archived: false,
 *     },
 * })
 *
 * //record before post
 * {
 *   id: '100',
 *   name: 'Company 1',
 *   meta: {
 *     archived: false,
 *   },
 * }
 *
 * //record after post
 * {
 *   id: '100',
 *   name: 'Company 1',
 *   meta: {
 *     archived: false,
 *   },
 *   ceo: {
 *     id: '5000',
 *     archived: false,
 *   },
 * }
 * ```
 *
 * @param  {String} table - Name of the table to update.
 * @param  {String} tableId - ID of the table to update.
 * @param  {String} field - Name of the field to update.
 * @param  {String} fieldId - ID to relace the field.
 * @return {Object} - RethinkDB query.
 */
export const postRecordOne = (table, tableId, field, fieldId) => (
  r.table(table).get(tableId).update({
    [field]: {
      id: fieldId,
      archived: false,
    },
  })
);

/**
 * Append the ID of the relationships that are returned from `setUnion` and `difference`.
 * If the relationships have changed:
 * Then we use basic set theory to determine what relationships to append to.
 * {@link https://github.com/endfire/redink/wiki}
 *
 * ```
 * // example RethinkDB query
 * r.do(r(['1', '2', '3']).setUnion(['1', '4']).difference(r(['1', '2', '3'])), ids => (
 *   ids.forEach(id => (
 *     r.table('enterprises').get(id).update(row => ({
 *       'listings': row('listings').append({ id: '100', archived: false }),
 *     }))
 *   ))
 * ))
 *
 * // example update call: listing
 * {
 *   id: '100',
 *   name: 'Listing 1',
 *   enterprises: {
 *     old: ['1', '2', '3'],
 *     new: ['1', 4'],
 *   },
 * }
 * ```
 *
 * @param  {String} table - Name of the table to update.
 * @param  {String} inverseField - Name of the field to update.
 * @param  {Object} data - Object containing old and new data.
 * @param  {String} appendId - ID to append to the field.
 * @return {Object} - RethinkDB query.
 */
export const updateAppendRecord = (table, inverseField, data, appendId) => (
  r.do(r(data.old).setUnion(data.new).difference(r(data.old)), ids => (
    ids.forEach(id => (
      r.table(table).get(id).update(row => ({
        [inverseField]: row(inverseField).append({ id: appendId, archived: false }),
      }))
    ))
  ))
);

/**
 * Archive the ID of the relationships that are returned from `setUnion` and `difference`.
 * If the relationships have changed:
 * Then we use basic set theory to determine what relationship to archive.
 * {@link https://github.com/endfire/redink/wiki}
 *
 * ```
 * // example RethinkDB query
 * r.do(r(['1', '2', '3']).setUnion(['1', '4']).difference(r(['1', '4'])), ids => (
 *   ids.forEach(id => (
 *     r.table('enterprise').get(id).update(row => ({
 *       'listings': row('listings').map(data => (
 *         r.branch(data('id').eq('100'),
 *           {
 *             id: data('id'),
 *             archived: true,
 *           }, {
 *             id: data('id'),
 *             archived: data('archived'),
 *           }
 *         )
 *       )),
 *     }))
 *   ))
 * ))
 *
 * // example update call: listing
 * {
 *   id: '100',
 *   name: 'Listing 1',
 *   enterprises: {
 *     old: ['1', '2', '3'],
 *     new: ['1', 4'],
 *   },
 * }
 * ```
 *
 * @param  {String} table - Name of the table to update.
 * @param  {String} inverseField - Name of the field to update.
 * @param  {Object} data - Object containing old and new data.
 * @param  {String} archiveId - ID to archive in the fields array.
 * @return {Object} - RethinkDB query.
 */
export const updateArchiveRecord = (table, inverseField, record, archiveId) => (
  r.do(r(record.old).setUnion(record.new).difference(r(record.new)), ids => (
    ids.forEach(id => (
      r.table(table).get(id).update(row => ({
        [inverseField]: row(inverseField).map(data => (
          r.branch(data('id').eq(archiveId),
            {
              id: data('id'),
              archived: true,
            }, {
              id: data('id'),
              archived: data('archived'),
            }
          )
        )),
      }))
    ))
  ))
);
