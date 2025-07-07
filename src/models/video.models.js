import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, //cloudinary url
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, //cloudinary
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// mongoose allows us to add plugins to schemas
videoSchema.plugin(mongooseAggregatePaginate);
// now this aggregatePaginate method can be used on the model to paginate the results of an aggregation query
// this is useful for paginating the results of an aggregation query, such as when we want to get a list of videos with pagination
// for example, we can use it to get a list of videos with pagination like this:
// Video.aggregatePaginate(query, options)
// in short its like giving us additional queries other than the default find, findOne, etc.
// additional meaning aggregation queries
// aggregation queries are used to perform complex queries on the database, such as filtering, sorting, and grouping data
// aggregation means combining data from multiple sources or documents to produce a single result

export const Video = mongoose.model("Video", videoSchema);
