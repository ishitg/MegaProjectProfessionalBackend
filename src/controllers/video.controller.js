import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Like } from "../models/like.models.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const pipeline = [];

  //   I wanna see vids where these search terms appear in title/description
  if (query) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } }, //match videos whose title contains the search term (query) and make it case-insensitive
          { description: { $regex: query, $options: "i" } },
        ],
      },
    });
  }

  //   I only wanna see vids uploaded by this user
  if (userId) {
    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });
  }

  //   getting owner details
  pipeline.push(
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
    }
  );

  const videoAggregate = await Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10), //specify base as well
    limit: parseInt(limit, 10),
  };

  const videos = await Video.aggregatePaginate(pipeline, options);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully!"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  // title
  // description
  // video file
  // thumbnail
  // get duration from cloudinary api

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video File is required!");
  }

  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required!");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "Video upload failed!");
  }

  if (!thumbnail) {
    throw new ApiError(400, "Thumbnail upload failed!");
  }

  const { duration } = videoFile;

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration,
    owner: req.user?._id,
  });

  const createdVideo = await Video.findById(video._id);

  if (!createdVideo) {
    throw new ApiError(500, "Video creation failed!");
  }

  const user = await User.findById(req.user._id);

  //   add video to user's watch history
  user.watchHistory.push(video._id);
  await user.save({ validateBeforeSave: false });

  return res
    .status(201)
    .json(new ApiResponse(201, createdVideo, "Video published successfully!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likeCount",
      },
    },
    {
      $addFields: {
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
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: { $size: "$subscribers" },
              isSubscribed: {
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
              username: 1,
              fullname: 1,
              avatar: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        totalLikes: {
          $size: "$likeCount",
        },
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        videoFile: 1,
        thumbnail: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        owner: 1,
        totalLikes: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video?.length) {
    throw new ApiError(404, "Video not found!");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $inc: { views: 1 },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully!"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;

  console.log(title, description, thumbnailLocalPath);
  console.log(req.file);

  if (!title || !description || !thumbnailLocalPath) {
    throw new ApiError(400, "All fields are required!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video!");
  }

  // const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    throw new ApiError(400, "Thumbnail upload failed!");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedVideo) {
    throw new ApiError(500, "Video update failed!");
  }

  await deleteFromCloudinary(thumbnailPublicId);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully!"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video!");
  }

  const videoPublicId = video.videoFile.split("/").pop().split(".")[0];
  const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(500, "Video deletion failed!");
  }

  await deleteFromCloudinary(videoPublicId);
  await deleteFromCloudinary(thumbnailPublicId, "video");

  await Like.deleteMany({
    video: videoId,
  });

  await Comment.deleteMany({
    video: videoId,
  });

  res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully!"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to toggle publish status!");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedVideo) {
    throw new ApiError(500, "Coudn't toggle publish status!");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isPublished: updatedVideo.isPublished,
      },
      "Video publish status toggled successfully!"
    )
  );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
