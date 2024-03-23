import mongoose, { Schema } from "mongoose";

const subsriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //user which is subscribbing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subsriptionSchema);
