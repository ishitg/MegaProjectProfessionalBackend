import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  const alreadySubscribed = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user?._id,
  });

  if (alreadySubscribed) {
    await Subscription.findByIdAndDelete(alreadySubscribed._id);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isSubscribed: false,
        },
        "Unsubscribed successfully"
      )
    );
  }

  const subscription = await Subscription.create({
    channel: channelId,
    subscriber: req.user?._id,
  });

  if (!subscription) {
    throw new ApiError(500, "Error while subscribing to channel");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isSubscribed: true,
      },
      "Subscribed successfully"
    )
  );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // if (channel?._id.toString() !== req.user?._id.toString()) {
  //   throw new ApiError(400, "Only channel owner can view subscribers");
  // }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
        pipeline: [
          {
            // here I'm in the subscriber's details
            $lookup: {
              from: "subscribers",
              localField: "_id",
              foreignField: "channel",
              as: "subscribersChannelFollowers",
              // now we'll go to the subscriber's channel and check if we're subscribed to them
            },
          },
          {
            $addFields: {
              AmIsubscribedtoSubscriber: {
                $cond: {
                  if: {
                    $in: [
                      new mongoose.Types.ObjectId(channel),
                      "$subscribersChannelFollowers.subscriber",
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
              subscribersChannelFollowersCount: {
                $size: "$subscribersChannelFollowers",
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriberDetails: {
          $first: "$subscriberDetails",
        },
      },
    },
    {
      $project: {
        subscriberDetails: {
          _id: 1,
          fullname: 1,
          username: 1,
          avatar: 1,
          AmIsubscribedtoSubscriber: 1,
          subscribersChannelFollowersCount: 1,
        },
      },
    },
  ]);

  if (!subscribers) {
    throw new ApiError(404, "No subscribers found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers,
        "User channel subscribers list fetched successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "channelSubscribersCount",
            },
          },
          {
            $addFields: {
              channelSubscribersCount: { $size: "$channelSubscribersCount" },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              fullname: 1,
              channelSubscribersCount: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        channelDetails: {
          $first: "$channelDetails",
        },
      },
    },
    {
      $project: {
        channelDetails: 1,
      },
    },
  ]);

  if (!channels?.length) {
    throw new ApiError(404, "No channels found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channels, "Subscribed channels fetched successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
