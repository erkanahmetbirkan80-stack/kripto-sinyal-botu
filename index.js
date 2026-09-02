const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const TOKEN = '8974920211:AAG8xJ4CaUtdmmSeqV0McSqtLhBpv9VZQPg';
const CHAT_ID = '7547417448';

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('15m Full SMC Bot Aktif!'));
app.listen(PORT, () => console.log(`Web sunucusu aktif.`));

bot.sendMessage(CHAT_ID, `🤖 Ultra SMC + Price Action Vadeli İşlem Botu Başlatıldı!\n\nTarama Kuralları: EMA Trend, BOS, FVG, Order Block, Breaker Block, Mitigation Block tamamen aktif.`);

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

async function fullSmcStratejiTara() {
    try {
        const symbols = await getFuturesSymbols();
        
        for (const symbol of symbols) {
            const res = await axios.get(`https://binance.com{symbol}&interval=15m&limit=210`);
            
            const mumlar = res.data.map(m => ({
                open: parseFloat(m[1]),
                high: parseFloat(m[2]),
                low: parseFloat(m[3]),
                close: parseFloat(m[4])
            }));

            if (mumlar.length < 200) continue;

            const son = mumlar.length - 1;
            const anlikFiyat = mumlar[son].close;
            const kapanislar = mumlar.map(m => m.close);

            // 1. EMA 50 ve EMA 200 Trend Kuralları
            const ema50 = hesaplaEMA(kapanislar, 50);
            const ema200 = hesaplaEMA(kapanislar, 200);
            const ema50Altinda = anlikFiyat < ema50;
            const ema50Ustunde = anlikFiyat > ema50;

            // 2. FVG Tespiti
            const bearishFVG = mumlar[son - 2].low > mumlar[son].high;
            const bullishFVG = mumlar[son - 2].high < mumlar[son].low;

            // 3. BOS (Break of Structure - Yapı Kırılımı)
            let bosBear = false, bosBull = false;
            const sonDusuk = Math.min(...mumlar.slice(son - 10, son - 2).map(m => m.low));
            const sonYuksek = Math.max(...mumlar.slice(son - 10, son - 2).map(m => m.high));
            if (mumlar[son - 1].close < sonDusuk) bosBear = true;
            if (mumlar[son - 1].close > sonYuksek) bosBull = true;

            // 4. Order Block (Emir Blokları)
            const bearishOB = mumlar[son - 1].close < mumlar[son - 1].open && mumlar[son - 2].close > mumlar[son - 2].open;
            const bullishOB = mumlar[son - 1].close > mumlar[son - 1].open && mumlar[son - 2].close < mumlar[son - 2].open;

            // 5. Breaker & Mitigation Block Simülasyonu
            const bearishBreaker = bosBear && mumlar[son - 1].close < mumlar[son - 3].low;
            const bullishBreaker = bosBull && mumlar[son - 1].close > mumlar[son - 3].high;
            const bearishMitigation = !bosBear && mumlar[son - 1].close < mumlar[son - 2].low;
            const bullishMitigation = !bosBull && mumlar[son - 1].close > mumlar[son - 2].high;

            let yön = null;
            let stop = 0, hedef = 0;
            let sinyalMaddeleri = [];

            // SHORT (AYI) ŞARTLARI BİRLEŞİMİ
            if (bearishOB || bearishFVG || bosBear) {
                yön = "🔴 SHORT";
                stop = mumlar[son - 2].high;
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
            }
            // LONG (BOĞA) ŞARTLARI BİRLEŞİMİ
            else if (bullishOB || bullishFVG || bosBull) {
                yön = "🟢 LONG";
                stop = mumlar[son - 2].low;
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

            // Sinyal mesajını gönder (En az 3 kural aynı anda tetiklendiyse sinyal kalitesini korur)
            if (yön && sinyalMaddeleri.length >= 3 && hedef > 0 && stop > 0) {
                const stopYuzdesi = ((Math.abs(anlikFiyat - stop) / anlikFiyat) * 100).toFixed(2);
                
                let mesaj = `⚡ YENİ KRİPTO SİNYALİ ⚡\n` +
                            `───────────────────\n` +
                            `📌 Coin: ${symbol}\n` +
                            `📊 Yön: ${yön}\n` +
                            `⏱️ Zaman Dilimi: 15 Dakika\n` +
                            `───────────────────\n` +
                            `🎯 Giriş: ${anlikFiyat.toFixed(5)}\n` +
                            `🛑 Stop: ${stop.toFixed(5)} (%${stopYuzdesi})\n` +
                            `💰 Hedef: ${hedef.toFixed(5)}\n` +
                            `📐 Risk/Reward: 2.05R\n` +
                            `───────────────────\n` +
                            `🔍 Sinyaller:\n` +
                            sinyalMaddeleri.join('\n');

                bot.sendMessage(CHAT_ID, mesaj);
            }
        }
    } catch (error) {
        console.error("SMC Tarama hatası:", error.message);
    }
}

setInterval(fullSmcStratejiTara, 15 * 60 * 1000);
