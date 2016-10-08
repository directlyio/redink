export default (checks, options) => {
  if (!checks) return true;

  const isTrue = check => (check === true);
  const checkPass = response => response.every(isTrue);

  return Promise
    .all(checks.map(check => {
      if (typeof check !== 'function') {
        return Promise.reject({
          message: `Tried invoking an check, but the check was not a function.
                    Instead, got ${typeof check}`,
        });
      }

      return check(options);
    }))
    .then(checkPass);
};
