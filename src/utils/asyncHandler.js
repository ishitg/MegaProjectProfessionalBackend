// promises method
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// higher order functions - functions that can take fns as parameter or return it

// try catch method

// const asyncHandler = () => {};
// const asyncHandler = (fn) => ()=>{};
// const asyncHandler = (fn) => async ()=>{};

// this is just a wrapper because this utility is gonna be used quite frequently

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message || "Something went wrong",
//     });
//   }
// };
