import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt, { decode } from "jsonwebtoken";
// when we logged the user in ,we sent the access token and refresh token in the cookies
// which means it was a true login
// now the cookie parser used was for this very purpose of middleware
//  it allowed us to use things like req.cookies, res.cookies
// so similiary we're gonna add a middleware to verify the JWT token
// then we'll use req.user to access the user details in the request
// so logout will be as simple as clearing the cookies

// basically we're checking if the user is logged in or not
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request, no token provided");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      //frontend work to be done
      // if the user is not found, it means the token is invalid or expired
      // refresh token will be used to get a new access token

      throw new ApiError(404, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
