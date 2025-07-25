import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.models.js";
const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const pipeline = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likeCount",
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
        createdAt: -1, //latest comments first
      },
    },
    {
      $project: {
        content: 1,
        ownerDetails: {
          username: 1,
          avatar: 1,
          fullname: 1,
        },
        likeCount: 1,
        createdAt: 1,
        isLiked: 1,
      },
    },
  ];

  const comments = await Comment.aggregatePaginate(pipeline, options);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully!"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required!");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(500, "There was an error while adding the comment!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully!"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found!");
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to edit this comment!");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedComment) {
    throw new ApiError(500, "There was an error while updating the comment!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment edited successfully!"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found!");
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment!");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(500, "There was an error while deleting the comment!");
  }

  await Like.deleteMany({
    comment: commentId,
    // likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully!"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
