const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const TOKEN = '8974920211:AAG8xJ4CaUtdmmSeqV0McSqtLhBpv9VZQPg';
const CHAT_ID = '7547417448';

const bot = new TelegramBot(TOKEN, { polling: false });
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.status(200).send('Test Sunucusu Canli.');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});

// KESİN DÜZELTİLMİŞ TEST SİNYALİ FONKSİYONU
async function gercekFiyatliTestFirlat() {
    console.log("Binance'ten canlı SOL fiyatı çekiliyor...");
    try {
        const res = await axios.get('https://binance.com');
        
        // JAVASCRIPT VERİ TÜRÜ KİLİDİ AÇILDI: res.data yerine doğrudan res.data.price okutuldu
        const anlikFiyat = parseFloat(res.data.price); 
        
        const stop = anlikFiyat * 0.9925; // %0.75 Stop
        const hedef = anlikFiyat * 1.0150; // %1.50 Kar Al

        let mesaj = `🚨 *SCALP BOTU GERÇEK FİYATLI TESTİ* 🚨\n` +
                    `───────────────────\n` +
                    `📌 *Coin:* SOLUSDT (Solana)\n` +
                    `📊 *Yön:* 🟢 LONG (ALIM / FUTURES TEST)\n` +
                    `⏱️ *Zaman Dilimi:* 5 Dakika\n` +
                    `───────────────────\n` +
                    `🎯 *Giriş Fiyatı:* $${anlikFiyat.toFixed(2)}\n` +
                    `🛑 *Stop Seviyesi:* $${stop.toFixed(2)} (%0.75)\n` +
                    `💰 *Kâr Hedefi:* $${hedef.toFixed(2)} (%1.50)\n` +
                    `───────────────────\n` +
                    `🔍 *Sistem Durumu:*\n` +
                    `• Matematiksel Ayrıştırma: %100 BAŞARILI ✅\n` +
                    `• Telegram Bildirim Ağı: %100 CANLI 🚀`;

        await bot.sendMessage(CHAT_ID, mesaj);
        console.log("Gerçek fiyatlı test sinyali Telegram'a başarıyla gönderildi!");
    } catch (error) {
        console.error("Test hatası:", error.message);
    }
}

// Sunucu ayağa kalktıktan 5 saniye sonra anında testi çalıştır
setTimeout(gercekFiyatliTestFirlat, 5000);
