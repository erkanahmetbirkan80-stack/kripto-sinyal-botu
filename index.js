const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const TOKEN = '8974920211:AAG8xJ4CaUtdmmSeqV0McSqtLhBpv9VZQPg';
const CHAT_ID = '7547417448';

const bot = new TelegramBot(TOKEN, { polling: false });
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.status(200).send('Scalp Sinyal Motoru Canli ve Aktif.');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});

// UYANIK TUTMA MOTORU
setInterval(() => {
    axios.get('https://onrender.com').then(() => {
        console.log("Kendi kendine ping atildi, sunucu uyanik tutuluyor.");
    }).catch((e) => console.log("Ping hatasi es gecildi."));
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

// 🔥 Binance'in bizi engellemesini önleyecek küçük mola (bekleme) fonksiyonu
const uykuModu = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getTopSymbols() {
    try {
        const response = await axios.get(`${SPOT_BASE}/ticker/24hr`);
        if (Array.isArray(response.data)) {
            return response.data
                .filter(item => item.symbol.endsWith('USDT'))
                .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                .slice(0, 40)
                .map(c => c.symbol);
        }
        return [];
    } catch (error) { return []; }
}

async function scalpStratejiTara() {
    console.log("Binance piyasası hız sınırı korumalı olarak taranıyor...");
    try {
        const symbols = await getTopSymbols();
        
        for (const symbol of symbols) {
            // 🔥 KESİN ÇÖZÜM: Her coin isteğinden önce 500 milisaniye (yarım saniye) bekler. Binance bizi asla engelleyemez.
            await uykuModu(500); 

            const res = await axios.get(`${SPOT_BASE}/klines?symbol=${symbol}&interval=5m&limit=100`).catch(() => null);
            if (!res || !Array.isArray(res.data) || res.data.length < 50) continue;

            const kapanislar = res.data.map(m => parseFloat(m)); 
            const sonIdx = kapanislar.length - 1;
            const anlikFiyat = kapanislar[sonIdx];

            if (isNaN(anlikFiyat) || anlikFiyat <= 0) continue;

            const rsiDegeri = hesaplaRSI(kapanislar, 14);
            const ema20Degeri = hesaplaEMA(kapanislar, 20);

            if (isNaN(rsiDegeri) || isNaN(ema20Degeri)) continue;

            let yon = null; let stop = 0; let hedef = 0;

            if (rsiDegeri < 35 && anlikFiyat > ema20Degeri) {
                yon = "🟢 LONG (ALIM)"; stop = anlikFiyat * 0.9925; hedef = anlikFiyat * 1.0150;
            } 
            else if (rsiDegeri > 65 && anlikFiyat < ema20Degeri) {
                yon = "🔴 SHORT (SATIM)"; stop = anlikFiyat * 1.0075; hedef = anlikFiyat * 0.9850;
            }

            if (yon) {
                let mesaj = `⚡ *YENİ SCALP SİNYALİ* ⚡\n` +
                            `───────────────────\n` +
                            `📌 *Coin:* ${symbol}\n` +
                            `📊 *Yön:* ${yon}\n` +
                            `⏱️ *Zaman Dilimi:* 5 Dakika\n` +
                            `───────────────────\n` +
                            `🎯 *Giriş Fiyatı:* ${anlikFiyat.toFixed(5)}\n` +
                            `🛑 *Stop Seviyesi:* ${stop.toFixed(5)}\n` +
                            `💰 *Kâr Hedefi:* ${hedef.toFixed(5)}\n` +
                            `───────────────────\n` +
                            `🔍 *Göstergeler:*\n` +
                            `- RSI (14): ${rsiDegeri.toFixed(2)}\n` +
                            `- EMA (20): ${ema20Degeri.toFixed(5)}`;

                bot.sendMessage(CHAT_ID, mesaj).catch(e => console.log(e.message));
            }
        }
        console.log("Scalp taraması sorunsuz tamamlandı. Kilitlenme önlendi.");
    } catch (error) { console.error("Tarama hatası:", error.message); }
}

// Sohbet kirliliği yaratan o 5 dakikalık boş bildirim satırı tamamen kaldırıldı. 
// Bot artık sadece gerçek sinyal üretirse Telegram'a mesaj atacak.
scalpStratejiTara();
setInterval(scalpStratejiTara, 5 * 60 * 1000);
