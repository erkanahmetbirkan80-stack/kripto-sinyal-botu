const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

// ✅ En son aldığımız çakışmasız güncel token
const TOKEN = '8974920211:AAH0FIFByn3035f94CPexmAirl_-FT3h1x8';
const CHAT_ID = '7547417448';

// GÜVENLİ POLLING MODU: Webhook karmaşasını kaldırıyoruz
const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('Finora AI Canli.');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});

// RENDER UYUMASINI ENGELLEYEN MOTOR
setInterval(() => {
    axios.get('https://onrender.com').then(() => {
        console.log("Ping atildi.");
    }).catch((e) => null);
}, 5 * 60 * 1000);

function hesaplaEMA(kapanislar, periyot) {
    if (kapanislar.length < periyot) return kapanislar[kapanislar.length - 1];
    const k = 2 / (periyot + 1);
    let ema = kapanislar.slice(0, periyot).reduce((a, b) => a + b, 0) / periyot;
    for (let i = periyot; i < kapanislar.length; i++) {
        ema = (kapanislar[i] * k) + (ema * (1 - k));
    }
    return ema;
}

function hesaplaRSI(kapanislar, periyot = 14) {
    if (kapanislar.length < periyot + 1) return 50;
    let kazaclar = 0; let kayiplar = 0;
    for (let i = 1; i <= periyot; i++) {
        let fark = kapanislar[i] - kapanislar[i - 1];
        if (fark > 0) kazaclar += fark; else kayiplar += Math.abs(fark);
    }
    let ortalamaKazanc = kazaclar / periyot; let ortalamaKayip = kayiplar / periyot;
    for (let i = periyot + 1; i < kapanislar.length; i++) {
        let fark = kapanislar[i] - kapanislar[i - 1];
        ortalamaKazanc = (ortalamaKazanc * (periyot - 1) + (fark > 0 ? fark : 0)) / periyot;
        ortalamaKayip = (ortalamaKayip * (periyot - 1) + (fark < 0 ? Math.abs(fark) : 0)) / periyot;
    }
    if (ortalamaKayip === 0) return 100;
    let rs = ortalamaKazanc / ortalamaKayip;
    return 100 - (100 / (1 + rs));
}

const SPOT_BASE = 'https://binance.com'; 

// 🎯 CANLI ANALİZ KOMUTU
bot.onText(/\/analiz (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!match || !match[1]) return;
    
    let gelenCoin = match[1].toUpperCase().trim(); 
    if (!gelenCoin.endsWith('USDT')) {
        gelenCoin = gelenCoin + 'USDT';
    }

    bot.sendMessage(chatId, `🤖 *Finora Engine:* ${gelenCoin} analizi başlatıldı...`);

    try {
        const url = `${SPOT_BASE}/klines?symbol=${gelenCoin}&interval=5m&limit=100`;
        const res = await axios.get(url);
        
        if (!res || !Array.isArray(res.data)) {
            return bot.sendMessage(chatId, `❌ Veri çekilemedi.`);
        }

        const kapanislar = res.data.map(m => parseFloat(m[4])); // Kapanış fiyatı (4. indeks)
        const anlikFiyat = kapanislar[kapanislar.length - 1];
        const rsiDegeri = hesaplaRSI(kapanislar, 14);
        const ema20Degeri = hesaplaEMA(kapanislar, 20);

        let trendDurumu = anlikFiyat > ema20Degeri ? "📈 YÜKSELİŞ TRENDİ" : "📉 DÜŞÜŞ TRENDİ";
        
        let raporMesaji = `🤖 *FINORA AI TEKNİK RAPORU* 🤖\n` +
                          `📌 *Varlık:* ${gelenCoin}\n` +
                          `💰 *Fiyat:* $${anlikFiyat}\n` +
                          `📊 *Trend:* ${trendDurumu}\n` +
                          `• RSI (14): ${rsiDegeri.toFixed(2)}\n` +
                          `• EMA (20): $${ema20Degeri.toFixed(2)}`;

        bot.sendMessage(chatId, raporMesaji);
    } catch (error) {
        bot.sendMessage(chatId, `❌ Sembol bulunamadı veya borsa hatası.`);
    }
});
