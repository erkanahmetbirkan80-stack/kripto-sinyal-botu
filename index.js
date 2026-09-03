const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const TOKEN = '8974920211:AAG8xJ4CaUtdmmSeqV0McSqtLhBpv9VZQPg';
const CHAT_ID = '7547417448';

const bot = new TelegramBot(TOKEN, { polling: false });
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.status(200).send('Test Motoru Aktif.');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});

// TEST AMAÇLI ZORUNLU SİNYAL TETİKLEME FONKSİYONU
async function testSinyaliGonder() {
    console.log("Binance'ten canlı SOL fiyatı çekiliyor ve test sinyali hazırlanıyor...");
    try {
        // Binance Spot API üzerinden canlı Solana fiyatını çekiyoruz
        const res = await axios.get('https://binance.com');
        const anlikFiyat = parseFloat(res.data.price);
        
        // Scalp mantığına göre otomatik stop ve hedef hesaplama
        const stop = anlikFiyat * 0.9925; // %0.75 Stop
        const hedef = anlikFiyat * 1.0150; // %1.50 Kar Al

        let mesaj = `🚨 *SCALP BOTU CANLI TEST SİNYALİ* 🚨\n` +
                    `───────────────────\n` +
                    `📌 *Coin:* SOLUSDT (Solana)\n` +
                    `📊 *Yön:* 🟢 LONG (ALIM / FUTURES TEST)\n` +
                    `⏱️ *Zaman Dilimi:* 5 Dakika\n` +
                    `───────────────────\n` +
                    `🎯 *Giriş Fiyatı:* $${anlikFiyat.toFixed(2)}\n` +
                    `🛑 *Stop Seviyesi:* $${stop.toFixed(2)} (%0.75)\n` +
                    `💰 *Kâr Hedefi:* $${hedef.toFixed(2)} (%1.50)\n` +
                    `───────────────────\n` +
                    `🔎 *Gösterge Durumu:*\n` +
                    `• Bu bir altyapı doğrulama testidir.\n` +
                    `• Binance Canlı Fiyat Bağlantısı: BAŞARILI ✅\n` +
                    `• Telegram Bildirim Motoru: BAŞARILI ✅`;

        // Telegram'a zorunlu olarak fırlatıyoruz
        await bot.sendMessage(CHAT_ID, mesaj);
        console.log("Zorunlu test sinyali Telegram'a başarıyla fırlatıldı!");
    } catch (error) {
        console.error("Test sinyali gönderilirken hata oluştu:", error.message);
    }
}

// Bot açılır açılmaz 5 saniye sonra testi tetikle
setTimeout(testSinyaliGonder, 5000);
