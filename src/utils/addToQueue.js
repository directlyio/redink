/**
 * Update `queue` with records that must be archived.
 *
 * @param {Object[]} queue - Queue of records to be archived.
 * @param {Object} actionObject - Used to determine what should be added to the `queue`.
 * @return {Object[]} queue
 */
export default (queue, actionObject) => {
  Object.keys(actionObject).forEach(field => {
    const { action, table, ids } = actionObject[field];

    if (action !== 'archive') return;

    if (Array.isArray(ids)) {
      ids.forEach(id => {
        queue.push({
          table,
          id,
        });
      });
    } else {
      queue.push({
        table,
        id: ids,
      });
    }
  });

  return queue;
};
