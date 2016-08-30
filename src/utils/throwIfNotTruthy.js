export default (x, err) => {
  const isTruthy = !!x;

  if (!isTruthy) {
    throw err;
  }

  return true;
};
