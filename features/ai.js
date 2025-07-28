const axios = require('axios');

module.exports = (bot) => {
  bot.registerCommand('ai', async (sock, msg, args, metadata) => {
    const { from, pushName } = metadata;
    
    if (!args[0]) {
      return bot.sendMessage(from, { text: `Gunakan: ${bot.prefix}ai [pertanyaan]` });
    }

    const question = args.join(' ');
    try {
      await bot.sendMessage(from, { text: '🔎 Mencari jawaban...' });
      
      const response = await axios.get(`https://api.vgxteam.xyz/ai/luminai}`);
      
      await bot.sendMessage(from, { 
        text: `*AI Response*\n\n${response.data.answer}\n\n_Powered by ULTRA-PREMIUM-AI_`
      });
    } catch (err) {
      console.error('[AI-ERROR]', err);
      await bot.sendMessage(from, { text: 'Gagal memproses permintaan AI' });
    }
  }, {
    desc: "Fitur AI Premium",
    category: "ai",
    usage: "[pertanyaan]",
    cooldown: 5000,
    isPremium: true
  });
};
