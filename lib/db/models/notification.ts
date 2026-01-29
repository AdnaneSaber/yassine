import mongoose, { Schema } from 'mongoose';
import type { INotification, INotificationDocument, NotificationStatus } from '@/types/database';

const notificationSchema = new Schema<INotificationDocument>({
  demandeId: {
    type: Schema.Types.ObjectId,
    ref: 'Demande',
    required: true
  },
  type: {
    type: String,
    enum: ['EMAIL', 'SMS'],
    default: 'EMAIL'
  },
  destinataire: {
    type: String,
    required: true
  },
  sujet: String,
  contenu: {
    type: String,
    required: true
  },
  templateUtilise: String,
  statutEnvoi: {
    type: String,
    enum: ['EN_ATTENTE', 'ENVOYE', 'ECHEC'],
    default: 'EN_ATTENTE'
  },
  nbTentatives: {
    type: Number,
    default: 0
  },
  dateEnvoi: Date,
  erreur: String
}, {
  timestamps: true,
  collection: 'notifications'
});

// Indexes
notificationSchema.index({ demandeId: 1 });
notificationSchema.index({ statutEnvoi: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.models.Notification || mongoose.model<INotificationDocument>('Notification', notificationSchema);
