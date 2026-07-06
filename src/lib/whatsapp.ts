import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { useMongoDBAuthState } from './mongoAuthState';
import { WhatsAppAuth } from '@/models/WhatsAppAuth';

// Define the global WhatsApp connection cache type
declare global {
  var globalWhatsApp: {
    sock: any;
    qrCodeDataUrl: string | null;
    status: 'disconnected' | 'connecting' | 'connected';
    user: any | null;
    cronInterval?: NodeJS.Timeout;
  } | undefined;
}

const getWhatsAppCache = () => {
  if (!global.globalWhatsApp) {
    global.globalWhatsApp = {
      sock: null,
      qrCodeDataUrl: null,
      status: 'disconnected',
      user: null,
      cronInterval: undefined
    };
  }
  return global.globalWhatsApp;
};

const startCronJobs = () => {
  const cache = getWhatsAppCache();
  if (cache.cronInterval) clearInterval(cache.cronInterval);
  
  // Run once immediately on connect, then every 12 hours
  const runCron = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
      await fetch(`${baseUrl}/api/cron/followups`);
      console.log('[WhatsApp Cron] Ran follow-up checks successfully.');
    } catch (e) {
      console.error('[WhatsApp Cron] Failed to run follow-up checks:', e);
    }
  };

  runCron();
  // 12 hours in milliseconds
  cache.cronInterval = setInterval(runCron, 12 * 60 * 60 * 1000);
};

export const initWhatsApp = async () => {
  const cache = getWhatsAppCache();
  if (cache.status === 'connecting' || cache.status === 'connected') {
    return;
  }

  cache.status = 'connecting';
  
  try {
    const { state, saveCreds } = await useMongoDBAuthState();

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: ['Doctor Portal', 'Chrome', '100.0.0'],
      logger: require('pino')({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      const cache = getWhatsAppCache();

      if (qr) {
        try {
          cache.qrCodeDataUrl = await QRCode.toDataURL(qr, { errorCorrectionLevel: 'H', margin: 2, scale: 8 });
        } catch (err) {
          console.error('Failed to generate QR code data URL', err);
        }
      }

      if (connection === 'close') {
        cache.status = 'disconnected';
        cache.sock = null;
        cache.user = null;
        cache.qrCodeDataUrl = null;
        
        const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          console.log('WhatsApp connection closed, reconnecting...');
          initWhatsApp();
        } else {
          console.log('WhatsApp connection logged out.');
        }
      } else if (connection === 'open') {
        cache.status = 'connected';
        cache.qrCodeDataUrl = null;
        cache.user = sock.user;
        console.log('WhatsApp connected successfully!');
        startCronJobs();
      }
    });

    cache.sock = sock;
    
  } catch (error) {
    cache.status = 'disconnected';
    console.error('Error initializing WhatsApp:', error);
  }
};

export const getWhatsAppStatus = () => {
  const cache = getWhatsAppCache();
  return {
    status: cache.status,
    qrCode: cache.qrCodeDataUrl,
    user: cache.user
  };
};

export const logoutWhatsApp = async () => {
  const cache = getWhatsAppCache();
  if (cache.sock) {
    try {
      await cache.sock.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
  }
  cache.status = 'disconnected';
  cache.sock = null;
  cache.user = null;
  cache.qrCodeDataUrl = null;
  if (cache.cronInterval) {
    clearInterval(cache.cronInterval);
    cache.cronInterval = undefined;
  }
  
  try {
    await WhatsAppAuth.deleteMany({});
    console.log('WhatsApp auth collection cleared.');
  } catch (err) {
    console.error('Failed to clear WhatsApp auth collection:', err);
  }
};

/**
 * Format phone number to WhatsApp JID format
 */
const formatPhoneNumber = (phone: string) => {
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  return `${clean}@s.whatsapp.net`;
};

/**
 * Send a text message via WhatsApp
 */
export const sendWhatsAppMessage = async (phone: string, text: string) => {
  const cache = getWhatsAppCache();
  if (!cache.sock || cache.status !== 'connected') {
    console.log('[WhatsApp] Not connected, cannot send message to', phone);
    return false;
  }
  
  try {
    const jid = formatPhoneNumber(phone);
    await cache.sock.sendMessage(jid, { text });
    console.log(`[WhatsApp] Sent message to ${jid}`);
    return true;
  } catch (error) {
    console.error(`[WhatsApp] Failed to send message to ${phone}:`, error);
    return false;
  }
};
