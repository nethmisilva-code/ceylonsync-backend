const apiResponse = (
  res,
  statusCode = 200,
  success = true,
  message = "Success",
  data = null,
  errors = null
) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    errors,
  });
};

export default apiResponse;