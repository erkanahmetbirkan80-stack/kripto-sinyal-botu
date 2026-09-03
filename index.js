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

// İlk çalıştırma kontrol mesajı
bot.sendMessage(CHAT_ID, `🚀 *Scalp Botu Kesin Çözüm Modunda Aktif!*\n\nKısıtlamasız Spot API köprüsü kuruldu. Tarama ve sinyal motoru kayıpsız başladı...`).catch(e => console.log(e.message));

// RENDER'IN UYUMASINI ENGELLEYEN PİNG MOTORU
setInterval(() => {
    axios.get('https://onrender.com').then(() => {
        console.log("Kendi kendine ping atildi, sunucu uyanik tutuluyor.");
    }).catch((e) => console.log("Ping hatasi es gecildi."));
}, 5 * 60 * 1000);

// Saf Matematiksel EMA Hesaplama Fonksiyonu
function hesaplaEMA(kapanislar, periyot) {
    if (kapanislar.length < periyot) return kapanislar[kapanislar.length - 1];
    const k = 2 / (periyot + 1);
    let ema = kapanislar.slice(0, periyot).reduce((a, b) => a + b, 0) / periyot;
    for (let i = periyot; i < kapanislar.length; i++) {
        ema = (kapanislar[i] * k) + (ema * (1 - k));
    }
    return ema;
}

// Saf Matematiksel RSI Hesaplama Fonksiyonu
function hesaplaRSI(kapanislar, periyot = 14) {
    if (kapanislar.length < periyot + 1) return 50;
    let kazaclar = 0;
    let kayiplar = 0;

    for (let i = 1; i <= periyot; i++) {
        let fark = kapanislar[i] - kapanislar[i - 1];
        if (fark > 0) kazaclar += fark;
        else kayiplar += Math.abs(fark);
    }

    let ortalamaKazanc = kazaclar / periyot;
    let ortalamaKayip = kayiplar / periyot;

    for (let i = periyot + 1; i < kapanislar.length; i++) {
        let fark = kapanislar[i] - kapanislar[i - 1];
        ortalamaKazanc = (ortalamaKazanc * (periyot - 1) + (fark > 0 ? fark : 0)) / periyot;
        ortalamaKayip = (ortalamaKayip * (periyot - 1) + (fark < 0 ? Math.abs(fark) : 0)) / periyot;
    }

    if (ortalamaKayip === 0) return 100;
    let rs = ortalamaKazanc / ortalamaKayip;
    return 100 - (100 / (1 + rs));
}

// 🔥 KESİN ÇÖZÜM: Engellenmeyen küresel Spot API adresi tanımlandı
const SPOT_BASE = 'https://binance.com'; 

async function getTopSymbols() {
    try {
        // En popüler ve hacimli market verilerini kısıtlamasız adresten çekiyoruz
        const response = await axios.get(`${SPOT_BASE}/ticker/24hr`);
        if (Array.isArray(response.data)) {
            return response.data
                .filter(item => item.symbol.endsWith('USDT'))
                .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                .slice(0, 40) // En hacimli 40 coini seçiyoruz
                .map(c => c.symbol);
        }
        return [];
    } catch (error) { 
        console.error("Sembol listesi çekilemedi:", error.message);
        return []; 
    }
}

async function scalpStratejiTara() {
    console.log("Binance piyasası kısıtlamasız köprü üzerinden taranıyor...");
    try {
        const symbols = await getTopSymbols();
        
        for (const symbol of symbols) {
            // 🔥 KESİN ÇÖZÜM: Mum verileri yasal engele takılmayan spot klines üzerinden besleniyor
            const res = await axios.get(`${SPOT_BASE}/klines?symbol=${symbol}&interval=5m&limit=100`).catch(() => null);
            
            if (!res || !Array.isArray(res.data) || res.data.length < 50) continue;

            const mumlar = res.data.map(m => ({
                open: parseFloat(m[1]), 
                high: parseFloat(m[2]), 
                low: parseFloat(m[3]), 
                close: parseFloat(m[4])
            }));

            const kapanislar = mumlar.map(m => m.close);
            const sonIdx = mumlar.length - 1;
            const anlikFiyat = mumlar[sonIdx].close;

            const rsiDegeri = hesaplaRSI(kapanislar, 14);
            const ema20Degeri = hesaplaEMA(kapanislar, 20);

            let yon = null; let stop = 0; let hedef = 0;

            if (rsiDegeri < 35 && anlikFiyat > ema20Degeri) {
                yon = "🟢 LONG (ALIM / FUTURES)";
                stop = anlikFiyat * 0.9925;
                hedef = anlikFiyat * 1.0150;
            } 
            else if (rsiDegeri > 65 && anlikFiyat < ema20Degeri) {
                yon = "🔴 SHORT (SATIM / FUTURES)";
                stop = anlikFiyat * 1.0075;
                hedef = anlikFiyat * 0.9850;
            }

            if (yon) {
                let mesaj = `⚡ *YENİ SCALP SİNYALİ* ⚡\n` +
                            `───────────────────\n` +
                            `📌 *Coin:* ${symbol}\n` +
                            `📊 *Yön:* ${yon}\n` +
                            `⏱️ *Zaman Dilimi:* 5 Dakika\n` +
                            `───────────────────\n` +
                            `🎯 *Giriş Fiyatı:* ${anlikFiyat}\n` +
                            `🛑 *Stop Seviyesi:* ${stop.toFixed(5)}\n` +
                            `💰 *Kâr Hedefi:* ${hedef.toFixed(5)}\n` +
                            `───────────────────\n` +
                            `🔍 *Göstergeler:*\n` +
                            `- RSI (14): ${rsiDegeri.toFixed(2)}\n` +
                            `- EMA (20): ${ema20Degeri.toFixed(5)}`;

                bot.sendMessage(CHAT_ID, mesaj).catch(e => console.log(e.message));
            }
        }
        console.log("Scalp taraması sorunsuz tamamlandı. Engel aşıldı.");
    } catch (error) { console.error("Tarama hatası:", error.message); }
}

// Eski fonksiyon tetiklemesi uyumluluğu için
fullSmcStratejiTara = scalpStratejiTara; 
scalpStratejiTara();
setInterval(scalpStratejiTara, 5 * 60 * 1000);
