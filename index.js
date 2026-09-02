const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const TOKEN = '8974920211:AAG8xJ4CaUtdmmSeqV0McSqtLhBpv9VZQPg';
const CHAT_ID = '7547417448';

// Polling çakışmalarını önlemek için güvenli bot tanımlama
const bot = new TelegramBot(TOKEN, { polling: true });

const app = express();
const PORT = process.env.PORT || 3000;

// Render'ın botu canlı tutması ve hata vermemesi için web sunucu rotası
app.get('/', (req, res) => {
    res.send('SMC Komut Botu Aktif ve Sinyal Tarihi Takip Ediliyor.');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda başarıyla ayağa kalktı.`);
});

// BOT HAFIZASI VE AYARLARI
let botAktif = true;
let aktifIslemler = [];
let basariliIslemler = 0;
let stopIslemler = 0;

// Botun başarıyla başladığını doğrulamak için ilk mesajı gönderiyoruz
bot.sendMessage(CHAT_ID, `🤖 Komut Panelli Ultra SMC Vadeli İşlem Botu Başlatıldı!\n\nKomutlar:\n/baslat - Taramayı başlatır\n/durdur - Taramayı askıya alır\n/acik - Mevcut sinyalleri listeler\n/rapor - Günlük başarı istatistiği`).catch(err => console.log("Telegram mesaj hatası:", err.message));

// TELEGRAM KOMUT DİNLEYİCİLERİ
bot.on('message', (msg) => {
    if (!msg.text || msg.chat.id.toString() !== CHAT_ID) return;
    
    const text = msg.text.trim();

    if (text === '/baslat') {
        botAktif = true;
        bot.sendMessage(CHAT_ID, "🟢 Tarama motoru başarıyla başlatıldı. 15 dakikalık mumlar izleniyor.");
    }
    else if (text === '/durdur') {
        botAktif = false;
        bot.sendMessage(CHAT_ID, "🔴 Tarama motoru durduruldu. Yeni sinyal gönderilmeyecek.");
    }
    else if (text === '/acik') {
        if (aktifIslemler.length === 0) {
            return bot.sendMessage(CHAT_ID, "📂 Şu anda takibe alınan aktif bir sinyal bulunmuyor.");
        }
        let liste = "📋 **AKTİF TAKİPTEKİ SİNYALLER**\n\n";
        aktifIslemler.forEach((islem, idx) => {
            liste += `${idx + 1}. 🪙 ${islem.symbol} | Yön: ${islem.yon}\n🚀 Giriş: $${islem.giris} | 🎯 TP: $${islem.tp}\n───────────────────\n`;
        });
        bot.sendMessage(CHAT_ID, liste);
    }
    else if (text === '/rapor') {
        const toplam = basariliIslemler + stopIslemler;
        const oran = toplam > 0 ? ((basariliIslemler / toplam) * 100).toFixed(1) : 0;
        
        const raporMesaji = `📊 **GÜNLÜK BAŞARI RAPORU**\n` +
                            `───────────────────\n` +
                            `🎯 Hedefe Ulaşan (TP): ${basariliIslemler}\n` +
                            `🛑 Zararla Kapanan (SL): ${stopIslemler}\n` +
                            `📈 Toplam Sinyal: ${toplam}\n` +
                            `📐 Başarı Oranı: %${oran}`;
        bot.sendMessage(CHAT_ID, raporMesaji);
    }
});

function hesaplaEMA(kapanislar, periyot) {
    if (kapanislar.length < periyot) return kapanislar[kapanislar.length - 1];
    const k = 2 / (periyot + 1);
    let ema = kapanislar.slice(0, periyot).reduce((a, b) => a + b, 0) / periyot;
    for (let i = periyot; i < kapanislar.length; i++) {
        ema = (kapanislar[i] * k) + (ema * (1 - k));
    }
    return ema;
}

async function getFuturesSymbols() {
    try {
        const response = await axios.get('https://binance.com');
        return response.data
            .filter(item => item.symbol.endsWith('USDT'))
            .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
            .slice(0, 50)
            .map(c => c.symbol);
    } catch (error) { return []; }
}

async function islemleriTakipEt() {
    if (aktifIslemler.length === 0) return;
    try {
        const response = await axios.get('https://binance.com');
        const fiyatlar = response.data;

        for (let i = aktifIslemler.length - 1; i >= 0; i--) {
            const islem = aktifIslemler[i];
            const guncelData = fiyatlar.find(f => f.symbol === islem.symbol);
            if (!guncelData) continue;
            
            const guncelFiyat = parseFloat(guncelData.price);

            if (islem.yon === "🟢 LONG") {
                if (guncelFiyat >= islem.tp) {
                    bot.sendMessage(CHAT_ID, `🎯 🎉 SİNYAL BAŞARIYLA HEDEFE GİTTİ!\n\n🪙 Coin: ${islem.symbol}\n💰 Kazanç: +2.05R Hedefine Ulaşıldı.`);
                    basariliIslemler++;
                    aktifIslemler.splice(i, 1);
                } else if (guncelFiyat <= islem.sl) {
                    bot.sendMessage(CHAT_ID, `🛑 Sinyal Zarar Kes (SL) Seviyesine Ulaştı.\n\n🪙 Coin: ${islem.symbol}`);
                    stopIslemler++;
                    aktifIslemler.splice(i, 1);
                }
            } else if (islem.yon === "🔴 SHORT") {
                if (guncelFiyat <= islem.tp) {
                    bot.sendMessage(CHAT_ID, `🎯 🎉 SİNYAL BAŞARIYLA HEDEFE GİTTİ!\n\n🪙 Coin: ${islem.symbol}\n💰 Kazanç: +2.05R Hedefine Ulaşıldı.`);
                    basariliIslemler++;
                    aktifIslemler.splice(i, 1);
                } else if (guncelFiyat >= islem.sl) {
                    bot.sendMessage(CHAT_ID, `🛑 Sinyal Zarar Kes (SL) Seviyesine Ulaştı.\n\n🪙 Coin: ${islem.symbol}`);
                    stopIslemler++;
                    aktifIslemler.splice(i, 1);
                }
            }
        }
    } catch (error) { console.error("Takip hatası:", error.message); }
}

async function fullSmcStratejiTara() {
    if (!botAktif) return;
    try {
        const symbols = await getFuturesSymbols();
        
        for (const symbol of symbols) {
            if (aktifIslemler.some(islem => islem.symbol === symbol)) continue;

            const res = await axios.get(`https://binance.com{symbol}&interval=15m&limit=210`);
            const mumlar = res.data.map(m => ({
                open: parseFloat(m), high: parseFloat(m), low: parseFloat(m), close: parseFloat(m)
            }));

            if (mumlar.length < 200) continue;

            const son = mumlar.length - 1;
            const anlikFiyat = mumlar[son].close;
            const kapanislar = mumlar.map(m => m.close);

            const ema50 = hesaplaEMA(kapanislar, 50);
            const ema50Altinda = anlikFiyat < ema50;
            const ema50Ustunde = anlikFiyat > ema50;

            const bearishFVG = mumlar[son - 2].low > mumlar[son].high;
            const bullishFVG = mumlar[son - 2].high < mumlar[son].low;

            let bosBear = false, bosBull = false;
            const sonDusuk = Math.min(...mumlar.slice(son - 10, son - 2).map(m => m.low));
            const sonYuksek = Math.max(...mumlar.slice(son - 10, son - 2).map(m => m.high));
            if (mumlar[son - 1].close < sonDusuk) bosBear = true;
            if (mumlar[son - 1].close > sonYuksek) bosBull = true;

            const bearishOB = mumlar[son - 1].close < mumlar[son - 1].open && mumlar[son - 2].close > mumlar[son - 2].open;
            const bullishOB = mumlar[son - 1].close > mumlar[son - 1].open && mumlar[son - 2].close < mumlar[son - 2].open;

            const bearishBreaker = bosBear && mumlar[son - 1].close < mumlar[son - 3].low;
            const bullishBreaker = bosBull && mumlar[son - 1].close > mumlar[son - 3].high;
            const bearishMitigation = !bosBear && mumlar[son - 1].close < mumlar[son - 2].low;
            const bullishMitigation = !bosBull && mumlar[son - 1].close > mumlar[son - 2].high;

            let yon = null; let stop = 0; let hedef = 0; let sinyalMaddeleri = [];

            if (bearishOB || bearishFVG || bosBear) {
                yon = "🔴 SHORT"; stop = mumlar[son - 2].high;
                const riskMesafesi = stop - anlikFiyat;
                if (riskMesafesi > 0) {
                    hedef = anlikFiyat - (riskMesafesi * 2.05);
                    if (ema50Altinda) sinyalMaddeleri.push("- Fiyat EMA50 altında");
                    if (bosBear) sinyalMaddeleri.push("- BOS_BEAR");
                    if (bearishFVG) sinyalMaddeleri.push("- Bearish FVG");
                    if (bearishBreaker) sinyalMaddeleri.push("- Bearish Breaker Block");
                    if (bearishOB) sinyalMaddeleri.push("- Bearish Order Block");
                    if (bearishMitigation) sinyalMaddeleri.push("- Bearish Mitigation Block");
                }
            } else if (bullishOB || bullishFVG || bosBull) {
                yon = "🟢 LONG"; stop = mumlar[son - 2].low;
                const riskMesafesi = anlikFiyat - stop;
                if (riskMesafesi > 0) {
                    hedef = anlikFiyat + (riskMesafesi * 2.05);
                    if (ema50Ustunde) sinyalMaddeleri.push("- Fiyat EMA50 üstünde");
                    if (bosBull) sinyalMaddeleri.push("- BOS_BULL");
                    if (bullishFVG) sinyalMaddeleri.push("- Bullish FVG");
                    if (bullishBreaker) sinyalMaddeleri.push("- Bullish Breaker Block");
                    if (bullishOB) sinyalMaddeleri.push("- Bullish Order Block");
                    if (bullishMitigation) sinyalMaddeleri.push("- Bullish Mitigation Block");
                }
            }

            if (yon && sinyalMaddeleri.length >= 3 && hedef > 0 && stop > 0) {
                const stopYuzdesi = ((Math.abs(anlikFiyat - stop) / anlikFiyat) * 100).toFixed(2);
                aktifIslemler.push({ symbol, yon, giris: anlikFiyat, tp: hedef, sl: stop });

                let mesaj = `⚡ YENİ KRİPTO SİNYALİ ⚡\n` +
                            `───────────────────\n` +
                            `📌 Coin: ${symbol}\n` +
                            `📊 Yön: ${yon}\n` +
                            `⏱️ Zaman Dilimi: 15 Dakika\n` +
                            `───────────────────\n` +
                            `🎯 Giriş: ${anlikFiyat.toFixed(5)}\n` +
                            `🛑 Stop: ${stop.toFixed(5)} (%${stopYuzdesi})\n` +
                            `💰 Hedef: ${hedef.toFixed(5)}\n` +
