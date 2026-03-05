import { model, Schema, Types } from "mongoose";

interface ISession {
  userId: Types.ObjectId;
  refreshTokenHash: string;
  refreshTokenValidUntil: Date;
  userAgent?: string;
  ip?: string;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    refreshTokenValidUntil: {
      type: Date,
      required: true,
      index: true,
    },
    userAgent: String,
    ip: String,
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

sessionSchema.index({ refreshTokenValidUntil: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = model<ISession>("Session", sessionSchema);
