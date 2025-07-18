import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //one who is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // one who is being subscribed
      ref: "User",
    },
  },
  { timestamps: true }
);

// imp note in ss
// (ツ C:\Users\ACER\Pictures\Screenshots\Screenshot (65).png ツ)

// mongodb aggregation pipelines are stages
// 1. match stage - filter the documents based on the condition
// 2. group stage - group the documents based on the condition
// 3. project stage - reshape the documents.. its like passing selected fields onto the next stage
// there are notes in ss..(66,67,68) refer to them

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
