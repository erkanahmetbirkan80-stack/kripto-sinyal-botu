const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const TOKEN = '8974920211:AAG8xJ4CaUtdmmSeqV0McSqtLhBpv9VZQPg';
const CHAT_ID = '7547417448';

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('15m Dengeli Sinyal Botu Aktif!'));
app.listen(PORT, () => console.log(`Web sunucusu aktif.`));

// ORAN AYARLARI (%1.5 Kâr ve %1.5 Zarar olarak eşitlenmiştir)
const TP_ORAN = 0.015; // %1.5 Kâr Al
const SL_ORAN = 0.015; // %1.5 Zarar Kes

bot.sendMessage(CHAT_ID, `📊 15 Dakikalık (15m) Dengeli Futures Botu Başlatıldı!\n\nStrateji: RSI + Bollinger\nHedefler: %1.5 TP / %1.5 SL (EŞİT)`);

function hesaplaRSI(kapanislar, periyot = 14) {
    if (kapanislar.length < periyot + 1) return 50;
    let kazu = 0, kayi = 0;
    for (let i = 1; i <= periyot; i++) {
        let fark = kapanislar[i] - kapanislar[i - 1];
        if (fark > 0) kazu += fark; else kayi -= fark;
    }
    let ortKazanc = kazu / periyot, ortKayip = kayi / periyot;
    for (let i = periyot + 1; i < kapanislar.length; i++) {
        let fark = kapanislar[i] - kapanislar[i - 1];
        ortKazanc = (ortKazanc * 13 + (fark > 0 ? fark : 0)) / 14;
        ortKayip = (ortKayip * 13 + (fark < 0 ? -fark : 0)) / 14;
    }
    if (ortKayip === 0) return 100;
    let rs = ortKazanc / ortKayip;
    return 100 - (100 / (1 + rs));
}

function hesaplaBollinger(kapanislar, periyot = 20, standartSapma = 2) {
    if (kapanislar.length < periyot) return { ust: 0, alt: 0 };
    const dilim = kapanislar.slice(-periyot);
    const ortalama = dilim.reduce((a, b) => a + b, 0) / periyot;
    const varyans = dilim.reduce((a, b) => a + Math.pow(b - ortalama, 2), 0) / periyot;
    const sapma = Math.sqrt(varyans);
    return { ust: ortalama + (standartSapma * sapma), alt: ortalama - (standartSapma * sapma) };
}

async function getFuturesSymbols() {
    try {
        const response = await axios.get('https://binance.com');
        return response.data.symbols
            .filter(s => s.quoteAsset === 'USDT' && s.status === 'TRADING')
            .map(s => s.symbol)
            .slice(0, 50); // Sunucu sağlığı için en hacimli ilk 50 coini tarar
    } catch (error) { return []; }
}

async function stratejiTTara() {
    try {
        const symbols = await getFuturesSymbols();
        
        for (const symbol of symbols) {
            const res = await axios.get(`https://binance.com{symbol}&interval=15m&limit=30`);
            const kapanislar = res.data.map(m => parseFloat(m[4])); // Kapanış fiyatını doğru almak için m[4] güncellendi
            const anlikFiyat = kapanislar[kapanislar.length - 1];

            const rsi = hesaplaRSI(kapanislar);
            const { ust, alt } = hesaplaBollinger(kapanislar);

            let sinyalTuru = null;
            let tp = 0, sl = 0;

            // LONG STRATEJİSİ
            if (rsi < 32 && anlikFiyat <= alt) {
                sinyalTuru = "🟢 LONG (ALIM)";
                tp = anlikFiyat * (1 + TP_ORAN); // %1.5 Yukarısı
                sl = anlikFiyat * (1 - SL_ORAN); // %1.5 Aşağısı
            } 
            // SHORT STRATEJİSİ
            else if (rsi > 68 && anlikFiyat >= ust) {
                sinyalTuru = "🔴 SHORT (SATIŞ)";
                tp = anlikFiyat * (1 - TP_ORAN); // %1.5 Aşağısı
                sl = anlikFiyat * (1 + SL_ORAN); // %1.5 Yukarısı
            }

            if (sinyalTuru) {
                const temizIsim = symbol.replace('USDT', ' / USDT');
                const mesaj = `⚡ #FUTURES 15M SINYAL\n\n` +
                              `🪙 Coin: ${temizIsim}\n` +
                              `📊 İşlem: ${sinyalTuru}\n\n` +
                              `🚀 GİRİŞ: $${anlikFiyat.toFixed(4)}\n` +
                              `🎯 KÂR AL (TP): $${tp.toFixed(4)}\n` +
                              `🛑 ZARAR KES (SL): $${sl.toFixed(4)}\n\n` +
                              `📈 RSI: ${rsi.toFixed(2)}`;
                
                bot.sendMessage(CHAT_ID, mesaj);
            }
        }
    } catch (error) { console.error("Tarama hatası:", error.message); }
}

setInterval(stratejiTTara, 15 * 60 * 1000); // 15 dakikada bir çalışır
