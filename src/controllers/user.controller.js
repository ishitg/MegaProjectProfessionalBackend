import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // check validation - not empty
  // check if user laready exits - email, username
  // check for images - avatar
  // upload them to cloudinary, multer
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  // when data comes from form or json body, we can access it using req.body
  const { fullname, email, username, password } = req.body;
  console.log("User Registration Data:", {
    fullname,
    email,
    username,
    password,
  });

  if (
    [fullname, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this email or username");
  }

  console.log(existingUser);

  // we have added a middleware in user.route.js to handle file uploads
  // so this middleware gives us more options in req.

  // here multer will give us an array of files in req.files

  // multer will also give us the path of the file in req.files.avatar[0].path
  // avatar[0] is an array because we can upload multiple files with the same name
  // and we set maxCount: 1 in multer middleware to limit it to one file
  // so multer has uploaded the file to our local server in the public folder
  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log(req.files);

  const coverImageLocalPath = req.files?.CoverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar image is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImg: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // you write what you don't desire to be returned in the response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User creation failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

export { registerUser };
