import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike?._id);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          isLiked: false,
        },
        "Video unliked successfully!"
      )
    );
  }

  const like = await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (!like) {
    throw new ApiError(500, "There was an error while liking the video!");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isLiked: true,
      },
      "Video liked successfully!"
    )
  );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike?._id);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          isLiked: false,
        },
        "Comment unliked successfully!"
      )
    );
  }

  const like = await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (!like) {
    throw new ApiError(500, "There was an error while liking the comment!");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isLiked: true,
      },
      "Comment liked successfully!"
    )
  );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike?._id);
    res.status(200).json(
      new ApiResponse(
        200,
        {
          isLiked: false,
        },
        "Tweet unliked successfully!"
      )
    );
  }

  const like = await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (!like) {
    throw new ApiError(500, "There was an error while liking the tweet!");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isLiked: true,
      },
      "Tweet liked successfully!"
    )
  );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
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
            $addFields: {
              ownerDetails: {
                $first: "$ownerDetails",
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likedVideo: {
          $first: "$likedVideo",
        },
      },
    },
    {
      $sort: {
        createdAt: -1, //most recently liked
      },
    },
    {
      $project: {
        likedVideo: {
          _id: 1,
          title: 1,
          description: 1,
          videoFile: 1,
          thumbnail: 1,
          duration: 1,
          views: 1,
          owner: 1,
          isPublished: 1,
          ownerDetails: 1,
          createdAt: 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully!")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
