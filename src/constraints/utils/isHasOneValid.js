export default (record, field) => {
  const fieldToCheck = record[field];

  if (!record) return false;
  if (!record._meta) return false;
  if (record._meta._archived) return false;
  if (!fieldToCheck) return true;
  if (fieldToCheck._archived) return true;
  if (fieldToCheck._related) return true;

  return false;
};
