import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  if (!req.body?.content?.trim()) {
    throw new ApiError(400, "Tweet content is required!");
  }

  const tweet = await Tweet.create({
    content: req.body?.content,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new ApiError(500, "There was an error while creating the tweet!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully!"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              fullname: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeCount",
        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        ownerDetails: {
          $first: "$ownerDetails",
        },
        likeCount: {
          $size: "$likeCount",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likeCount.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1, //latest community posts first
      },
    },
    {
      $project: {
        content: 1,
        ownerDetails: 1,
        likeCount: 1,
        createdAt: 1,
        isLiked: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully!"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Tweet content is required!");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found!");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to edit this tweet!");
  }

  const newTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!newTweet) {
    throw new ApiError(500, "There was an error while updating the tweet!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newTweet, "Tweet updated successfully!"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found!");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this tweet!");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletedTweet) {
    throw new ApiError(500, "There was an error while deleting the tweet!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully!"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
