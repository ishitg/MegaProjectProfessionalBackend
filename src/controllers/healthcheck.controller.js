import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import dbConnect from "../db/index.js";

const healthcheck = asyncHandler(async (req, res) => {
  //TODO: build a healthcheck response that simply returns the OK status as json with a message

  try {
    dbConnect();
    return res
      .status(200)
      .json(new ApiResponse(200, "OK", "Healthcheck successful"));
  } catch (error) {
    throw new ApiError(500, "Healthcheck failed");
  }
});

export { healthcheck };
