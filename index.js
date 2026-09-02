const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const TOKEN = '8974920211:AAG8xJ4CaUtdmmSeqV0McSqtLhBpv9VZQPg';
const CHAT_ID = '7547417448';

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('5m Agresif Sinyal Botu Aktif!'));
app.listen(PORT, () => console.log(`Web sunucusu aktif.`));

// ORAN AYARLARI (100$ İşlemde 10x ile 100$ Kâr / 100$ Zarar için %10 olarak ayarlandı)
const TP_ORAN = 0.10; // %10.0 Kâr Al (10x ile %100 Kazanç -> +100$)
const SL_ORAN = 0.10; // %10.0 Zarar Kes (10x ile %100 Kayıp / Lik -> -100$)

bot.sendMessage(CHAT_ID, `🚀 5m Büyük Hedefli Futures Botu Başlatıldı!\n\nHedefler: 10x için +100$ Kâr (TP) / -100$ Zarar (SL)`);

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
    return 100 - (100 / (1 + (ortKazanc / ortKayip)));
}

function hesaplaBollinger(kapanislar, periyot = 20, standartSapma = 2) {
    if (kapanislar.length < periyot) return { ust: 0, alt: 0 };
    const dilim = kapanislar.slice(-periyot);
    const ortalama = dilim.reduce((a, b) => a + b, 0) / periyot;
    const varyans = dilim.reduce((a, b) => a + Math.pow(b - ortalama, 2), 0) / periyot;
    return { 
        ust: ortalama + (standartSapma * Math.sqrt(varyans)), 
        alt: ortalama - (standartSapma * Math.sqrt(varyans)) 
    };
}

function hesaplaEMA(kapanislar, periyot) {
    if (kapanislar.length < periyot) return kapanislar[kapanislar.length - 1];
    const k = 2 / (periyot + 1);
    let ema = kapanislar.slice(0, periyot).reduce((a, b) => a + b, 0) / periyot;
    for (let i = periyot; i < kapanislar.length; i++) {
        ema = (kapanislar[i] * k) + (ema * (1 - k));
    }
    return ema;
}

function hesaplaMACD(kapanislar) {
    if (kapanislar.length < 35) return { histogram: 0 };
    let ema12Dizisi = [];
    let ema26Dizisi = [];
    for(let i = 15; i <= kapanislar.length; i++) {
        const altDilim = kapanislar.slice(0, i);
        ema12Dizisi.push(hesaplaEMA(altDilim, 12));
        ema26Dizisi.push(hesaplaEMA(altDilim, 26));
    }
    let macdGecmisi = [];
    for(let i = 0; i < ema12Dizisi.length; i++) {
        macdGecmisi.push(ema12Dizisi[i] - ema26Dizisi[i]);
    }
    const macdCizgisi = macdGecmisi[macdGecmisi.length - 1];
    const sinyalCizgisi = hesaplaEMA(macdGecmisi, 9);
    return { histogram: macdCizgisi - sinyalCizgisi };
}

async function getFuturesSymbolsAndVolume() {
    try {
        const response = await axios.get('https://binance.com');
        return response.data
            .filter(item => item.symbol.endsWith('USDT'))
            .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
            .slice(0, 50); 
    } catch (error) { return []; }
}

async function stratejiTTara() {
    try {
        const topHacimliCoinler = await getFuturesSymbolsAndVolume();
        
        for (const coin of topHacimliCoinler) {
            const symbol = coin.symbol;
            const hacimDolar = parseFloat(coin.quoteVolume);

            const res = await axios.get(`https://binance.com{symbol}&interval=5m&limit=60`);
            const kapanislar = res.data.map(m => parseFloat(m)); 
            const anlikFiyat = kapanislar[kapanislar.length - 1];

            const rsi = hesaplaRSI(kapanislar);
            const { ust, alt } = hesaplaBollinger(kapanislar);
            
            const ema20 = hesaplaEMA(kapanislar, 20);
            const ema50 = hesaplaEMA(kapanislar, 50);
            const trendYonu = ema20 > ema50 ? "📈 YUKARI (Boğa)" : "📉 AŞAĞI (Ayı)";

            const { histogram } = hesaplaMACD(kapanislar);

            let sinyalTuru = null;
            let tp = 0, sl = 0;

            if (rsi < 35 && anlikFiyat <= alt && histogram >= -0.005) {
                sinyalTuru = "🟢 LONG (ALIM)";
                tp = anlikFiyat * (1 + TP_ORAN); 
                sl = anlikFiyat * (1 - SL_ORAN); 
            } 
            else if (rsi > 65 && anlikFiyat >= ust && histogram <= 0.005) {
                sinyalTuru = "🔴 SHORT (SATIŞ)";
                tp = anlikFiyat * (1 - TP_ORAN); 
                sl = anlikFiyat * (1 + SL_ORAN); 
            }

            if (sinyalTuru) {
                const temizIsim = symbol.replace('USDT', ' / USDT');
                const milyonHacim = (hacimDolar / 1000000).toFixed(2);
                
                const mesaj = `⚡ #FUTURES 5M BÜYÜK HEDEF\n\n` +
                              `🪙 Coin: ${temizIsim}\n` +
                              `📊 İşlem: ${sinyalTuru}\n` +
                              `🔄 Trend Yönü: ${trendYonu}\n` +
                              `💰 24S Hacim: $${milyonHacim}M\n\n` +
                              `🚀 GİRİŞ: $${anlikFiyat.toFixed(4)}\n\n` +
                              `🎯 KÂR AL (TP): $${tp.toFixed(4)} (+100$ Kâr)\n` +
                              `🛑 ZARAR KES (SL): $${sl.toFixed(4)} (-100$ Zarar / LİK)\n\n` +
                              `📈 RSI: ${rsi.toFixed(2)}\n` +
                              `💡 Not: Hesaplamalar 100$ bakiye ve 10x kaldıraç için birebir ayarlanmıştır.`;
                
                bot.sendMessage(CHAT_ID, mesaj);
            }
        }
    } catch (error) { console.error("Tarama hatası:", error.message); }
}

setInterval(stratejiTTara, 5 * 60 * 1000);
