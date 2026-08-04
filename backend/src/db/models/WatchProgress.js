const { mongoose } = require("../index");

const watchProgressSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    anime_url: { type: String, required: true },
    anime_title: { type: String, required: true },
    anime_cover: { type: String, default: null },
    provider: { type: String, default: null, maxlength: 32 },
    episode_num: { type: Number, required: true },
    episode_url: { type: String, required: true },
    updated_at: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "watch_progress",
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

watchProgressSchema.index({ user_id: 1, anime_url: 1 }, { unique: true });
watchProgressSchema.index({ user_id: 1, updated_at: -1 });

module.exports =
  mongoose.models.WatchProgress || mongoose.model("WatchProgress", watchProgressSchema);
