const axios = require('axios');
const fs = require('fs');

module.exports = (bot) => {
  bot.registerCommand('ytdl', async (sock, msg, args, metadata) => {
    const { from } = metadata;
    
    if (!args[0]) {
      return bot.sendMessage(from, { text: `Gunakan: ${bot.prefix}ytdl [url]` });
    }

    const url = args[0];
    try {
      await bot.sendMessage(from, { text: '⏳ Mengunduh video...' });
      
      const response = await axios.get(`https://api.ultra-premium-dl.com/video?url=${encodeURIComponent(url)}`, {
        responseType: 'stream'
      });
      
      await bot.sendMessage(from, {
        video: response.data,
        caption: '✅ Unduhan selesai - ULTRA-PREMIUM-DOWNLOADER'
      });
    } catch (err) {
      console.error('[DL-ERROR]', err);
      await bot.sendMessage(from, { text: 'Gagal mengunduh video' });
    }
  }, {
    desc: "Downloader YouTube Premium",
    category: "downloader",
    usage: "[url]",
    cooldown: 10000,
    isPremium: true
  });
};
