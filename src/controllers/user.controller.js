import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error while generating access and refresh tokens");
  }
};

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
  // console.log("User Registration Data:", {
  //   fullname,
  //   email,
  //   username,
  //   password,
  // });

  if (
    [fullname, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this email or username");
  }

  // console.log(existingUser);

  // we have added a middleware in user.route.js to handle file uploads
  // so this middleware gives us more options in req.

  // here multer will give us an array of files in req.files

  // multer will also give us the path of the file in req.files.avatar[0].path
  // avatar[0] is an array because we can upload multiple files with the same name
  // and we set maxCount: 1 in multer middleware to limit it to one file
  // so multer has uploaded the file to our local server in the public folder
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // console.log(req.files);

  // const coverImageLocalPath = req.files?.coverImg[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImg) &&
    req.files.coverImg.length > 0
  ) {
    coverImageLocalPath = req.files.coverImg[0].path;
  }

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

const loginUser = asyncHandler(async (req, res) => {
  // username/email and password are required
  // check if user exists
  // password should match
  // check access token
  // generate via refresh token
  // return user details without password and refresh token
  // send cookie

  // console.log("User Login Data:", req.body);
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new ApiError(404, "User does not exist with this email or username");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: false,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in succesfully"
      )
    );

  // we're sending the access token and refresh token as cookies
  // so that the client can use them to access protected routes
  // and also sending it as response so that the client can store them in local storage or session storage
  // cuz maybe they're developing a mobile app or something
  // in mobile apps, we don't use cookies, we use local storage or session storage
});

const logoutUser = asyncHandler(async (req, res) => {
  // clear cookies
  // remove refresh token from user
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      // the returned response will be the updated user
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // give me refersh token from cookies
  // then hit a route with this refersh token
  // then I'll generate a new access token for ya upon verification
  const incomingRefreshToken = req.cookies.accessToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // now we'll have to match the refresh token in the database with the one we got from the user
    // so here's how it goes
    // there's this incoming refresh token from the user
    // we decoded it and got the user id
    // now we'll find the user in the database
    // then we'll check if the refresh token in the database matches the one we got from the user
    // if it matches, we'll generate a new access token and return it to the user
    // the database refresh token is the one we saved when the user logged in
    // and this database also store the encoded refresh token

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token expired or is invalid");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Avatar image upload failed");
  }

  const publicId = req.user.avatar.split("/").pop().split(".")[0];
  // console.log(publicId);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  // delete old avatar from cloudinary
  await deleteFromCloudinary(publicId);

  res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const CoverImageLocalPath = req.file?.path;

  if (!CoverImageLocalPath) {
    throw new ApiError(400, "Cover image is required");
  }

  const coverImage = await uploadOnCloudinary(CoverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Cover image upload failed");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImg: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  // imp note in ss
  // (ツ C:\Users\ACER\Pictures\Screenshots\Screenshot (65).png ツ)

  // mongodb aggregation pipelines are stages
  // 1. match stage - filter the documents based on the condition
  // 2. group stage - group the documents based on the condition
  // 3. project stage - reshape the documents.. its like passing selected fields onto the next stage
  // there are notes in ss..(66,67,68) refer to them

  // User.find({username})
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      // its like a join in sql
      // left join
      $lookup: {
        from: "subscriptions",
        localField: "_id", //matlab CAC
        foreignField: "channel", //channel == CAC
        as: "subscribers",
      },
      // bohot saare documents hai
      // user a subscribes to CAC
      // user b subscribes to CAC
      // so new document generates where channel is CAC and subscriber is a
      // to count no of subscribers, count documents where channel is CAC
      // to count no of people user a is subscribed to, we can use $lookup again
      // and count the documents where subscriber is a
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber", // subscriber == user a
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        ChannelsSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          // $in is used to check if the user is subscribed to the channel
          // means if the user id is present in the subscribers array
          // so here $subcribers is an array of objects
          // each object has a subscriber field which is the user id of the subscriber
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        // jo chize pass on karni hai unka flag 1 kar do
        // jo nahi chahiye unka flag 0 kar do
        // its done to reduce network traffic
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        ChannelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImg: 1,
        email: 1,
      },
    },
  ]);
  // TODO look at console log

  // what data type does aggregate return?
  // it returns an array of objects

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }
  console.log("User Channel Profile Data:", channel);

  return res.status(200).json(
    new ApiResponse(
      200,
      channel[0], // since we are matching by username, there will be only one channel
      "User channel fetched successfully"
    )
  );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  // req.user._id
  // what do you get?
  // you get a string
  // at mongo db it'll be stored as an ObjectId
  // like ObjectId("64f8c8e8f8c8e8f8c8e8f8c")
  // but since we are using mongoose, it will automatically convert the string to mongo db ObjectId
  const user = await User.aggregate([
    {
      $match: {
        // _id: req.user._id
        // this won't work because here in aggregation pipelines, mongoose doesn't work and data goes directly to mongo db
        // so we have to create the mongoose ObjectId from the string
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos", // the collection name in mongo db
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        // we've to use a nested pipeline here because when we'll get the watchHistory, it will be an array of video ids
        // and the owner field won't be populated
        // because the owner field is an ObjectId and not a string
        // so we've to use a sub-pipeline to populate the owner field
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              // TODO what'll happen if I take this nested pipeline below outside to the next stage?
              // it won't work because the owner field will be an array of objects
              // in a way it works but the structure of the data will be different
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
            // {
            //   // TODO what happens if I take that pipeline here?
            // }
          },
          // since lookup will return an array of objects
          // the owner field is indeed an array of objects
          // owner[0] will have that data in project stage, so to make things easier for frontend
          // so we'll try to change the structure of the data
          {
            $addFields: {
              owner: {
                $first: "$owner", // this will take the first element of the owner array
                // so frontend will get the owner object directly
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user?.length) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
