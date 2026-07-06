import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISettings extends Document {
  closedDates: string[];
  closedDaysOfWeek: number[];
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema<ISettings> = new Schema(
  {
    closedDates: { type: [String], default: [] },
    closedDaysOfWeek: { type: [Number], default: [] },
  },
  {
    timestamps: true,
  }
);

export const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
