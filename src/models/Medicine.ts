import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMedicine extends Document {
  name: string;
  type?: string; // Tablet, Syrup, Injection, etc.
  typicalDosage?: string;
  typicalFrequency?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema: Schema<IMedicine> = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: false },
    typicalDosage: { type: String, required: false },
    typicalFrequency: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

// Add text index for fuzzy search if needed, though regex search is fine for small DBs
MedicineSchema.index({ name: 'text' });

export const Medicine: Model<IMedicine> =
  mongoose.models.Medicine || mongoose.model<IMedicine>('Medicine', MedicineSchema);
