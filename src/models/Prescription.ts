import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPrescribedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface IPrescription extends Document {
  patientId?: mongoose.Types.ObjectId;
  patientName: string;
  phone: string;
  age: string;
  diagnosis: string;
  medicines: IPrescribedMedicine[];
  notes?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PrescribedMedicineSchema = new Schema<IPrescribedMedicine>({
  name: { type: String, required: true },
  dosage: { type: String, required: false },
  frequency: { type: String, required: true }, // OD, BD, TDS, etc.
  duration: { type: String, required: true }, // e.g., 5 days
  instructions: { type: String, required: false }, // e.g., After meals
});

const PrescriptionSchema: Schema<IPrescription> = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: false },
    patientName: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: String, required: true },
    diagnosis: { type: String, required: true, index: true },
    medicines: [PrescribedMedicineSchema],
    notes: { type: String, required: false },
    followUpDate: { type: Date, required: false },
  },
  {
    timestamps: true,
  }
);

// Add text index for diagnosis for smart suggestions
PrescriptionSchema.index({ diagnosis: 'text' });

export const Prescription: Model<IPrescription> =
  mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
