const { mongoose } = require("../index");

const favoriteSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    anime_url: { type: String, required: true },
    anime_title: { type: String, required: true },
    anime_cover: { type: String, default: null },
    provider: { type: String, default: null, maxlength: 32 },
    added_at: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "favorites",
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

favoriteSchema.index({ user_id: 1, anime_url: 1 }, { unique: true });
favoriteSchema.index({ user_id: 1, added_at: -1 });

module.exports = mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);
