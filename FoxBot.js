const { WhiskeySockets, Boom } = require('whiskeysockets');
const Baileys = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

// Config Premium
const premiumConfig = {
  name: "FoxBot",
  prefix: "!",
  owner: "6281234567890", 
  session: "ultra_session",
  apikey: "ULTRA-API-KEY-2024",
  mods: ["6289876543210"],
  botAdmin: true,
  autoRead: true,
  nsfw: false,
  premium: true,
  antiCall: true,
  antiDelete: true,
  autobio: false,
  restrict: false
};

class UltraPremiumBot {
  constructor() {
    this.sock = null;
    this.ev = null;
    this.commands = new Map();
    this.features = new Map();
    this.cooldowns = new Map();
    this.userData = new Map();
    this.groupData = new Map();
    this.startTime = new Date();
  }

  async initialize() {
    try {
      // Auth
      const { state, saveCreds } = await Baileys.useMultiFileAuthState(premiumConfig.session);
      
      // Socket
      this.sock = WhiskeySockets({
        auth: state,
        printQRInTerminal: true,
        logger: Baileys.P({ level: 'silent' }),
        browser: ['ULTRA-PREMIUM', 'Safari', '5.0'],
        markOnlineOnConnect: true,
        syncFullHistory: false,
        defaultQueryTimeoutMs: 60000,
        maxMsgRetryCount: 5,
        connectTimeoutMs: 30000
      });

      this.ev = this.sock.ev;
      this.ev.on('creds.update', saveCreds);

      // Load Features
      this.loadAllFeatures();

      // Event Handlers
      this.setupHandlers();

      console.log('[ULTRA] Bot Premium Berhasil di Jalankan!');
      
    } catch (err) {
      console.error('[ULTRA-ERROR]', err);
      process.exit(1);
    }
  }

  loadAllFeatures() {
    const featuresPath = path.join(__dirname, 'features');
    const featureFiles = fs.readdirSync(featuresPath).filter(file => file.endsWith('.js'));

    featureFiles.forEach(file => {
      const feature = require(path.join(featuresPath, file));
      if (typeof feature === 'function') {
        feature(this);
        console.log(`[ULTRA] Loaded Feature: ${file}`);
      }
    });
  }

  setupHandlers() {
    // Message Handler
    this.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0];
      if (!msg.message) return;

      const content = JSON.stringify(msg.message);
      const from = msg.key.remoteJid;
      const isCmd = content.includes(premiumConfig.prefix);
      const isGroup = from.endsWith('@g.us');
      const pushName = msg.pushName || 'User';
      const isOwner = from === premiumConfig.owner + '@s.whatsapp.net';
      const isMods = premiumConfig.mods.includes(from.replace('@s.whatsapp.net', ''));

      try {
        if (isCmd) {
          const body = content.split(premiumConfig.prefix)[1].split('"')[0].trim();
          const [cmd, ...args] = body.split(' ');
          const command = cmd.toLowerCase();

          if (this.commands.has(command)) {
            const cmdObj = this.commands.get(command);
            
            // Check Cooldown
            const cooldownKey = `${from}:${command}`;
            const now = Date.now();
            if (this.cooldowns.has(cooldownKey)) {
              const remaining = (this.cooldowns.get(cooldownKey) + (cmdObj.cooldown || 3000)) - now;
              if (remaining > 0) return;
            }
            this.cooldowns.set(cooldownKey, now);

            // Execute Command
            await cmdObj.execute(this.sock, msg, args, {
              from, pushName, isGroup, isOwner, isMods
            });
          }
        }
      } catch (err) {
        console.error('[CMD-ERROR]', err);
      }
    });

    // Connection Handler
    this.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
        console.log('[ULTRA] Connection lost, reconnecting...');
        if (shouldReconnect) this.initialize();
      } else if (connection === 'open') {
        console.log('[ULTRA] Connected to WhatsApp!');
      }
    });

    // Anti Call
    if (premiumConfig.antiCall) {
      this.ev.on('call', async (call) => {
        const from = call.from;
        await this.sock.updateBlockStatus(from, 'block');
        console.log(`[ULTRA] Blocked call from ${from}`);
      });
    }
  }

  registerCommand(command, callback, options = {}) {
    this.commands.set(command, {
      execute: callback,
      cooldown: options.cooldown || 3000,
      desc: options.desc || 'No description',
      category: options.category || 'general',
      usage: options.usage || '',
      isPremium: options.isPremium || false,
      isOwner: options.isOwner || false,
      isGroup: options.isGroup || false,
      isAdmin: options.isAdmin || false,
      isBotAdmin: options.isBotAdmin || false
    });
  }

  async sendMessage(jid, content, options = {}) {
    try {
      await this.sock.sendMessage(jid, content, options);
    } catch (err) {
      console.error('[SEND-MSG-ERROR]', err);
    }
  }
}

// Start Bot
const bot = new UltraPremiumBot();
bot.initialize();

// Error Handling
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED-REJECTION]', err);
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT-EXCEPTION]', err);
});
