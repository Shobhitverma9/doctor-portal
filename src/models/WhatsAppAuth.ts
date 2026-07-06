import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWhatsAppAuth {
  _id: string;
  data: any;
}

const WhatsAppAuthSchema: Schema<IWhatsAppAuth> = new Schema(
  {
    _id: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
  }
);

export const WhatsAppAuth: Model<IWhatsAppAuth> =
  mongoose.models.WhatsAppAuth || mongoose.model<IWhatsAppAuth>('WhatsAppAuth', WhatsAppAuthSchema);
