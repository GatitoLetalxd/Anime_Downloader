const { mongoose } = require("../index");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, maxlength: 32 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 255 },
    password: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ["user", "admin"], default: "user" },
    avatar: { type: String, required: true, default: "avatar_01.png", maxlength: 50 },
    is_banned: { type: Boolean, required: true, default: false },
    banned_at: { type: Date, default: null },
    created_at: { type: Date, required: true, default: Date.now },
    last_seen: { type: Date, default: null },
    expires_at: { type: Date, default: null },
  },
  {
    collection: "users",
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.password;
        return ret;
      },
    },
  }
);

userSchema.index({ created_at: -1 });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
