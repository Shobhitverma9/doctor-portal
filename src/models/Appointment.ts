import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAppointment extends Document {
  patientName: string;
  phone: string;
  email: string;
  age: string;
  problem: string;
  summary?: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'open' | 'completed' | 'cancelled';
  followupDate?: string;
  followupReminderSent?: boolean;
  missedFollowupSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema<IAppointment> = new Schema(
  {
    patientName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    age: { type: String, required: true },
    problem: { type: String, required: false },
    summary: { type: String, required: false },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'open', 'completed', 'cancelled'],
      default: 'pending',
    },
    followupDate: { type: String, required: false },
    followupReminderSent: { type: Boolean, default: false },
    missedFollowupSent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Appointment: Model<IAppointment> =
  mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
