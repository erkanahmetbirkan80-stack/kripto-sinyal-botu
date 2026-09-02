const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const TOKEN = '8974920211:AAG8xJ4CaUtdmmSeqV0McSqtLhBpv9VZQPg';
const CHAT_ID = '7547417448';

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('15m SMC Pro Bot Aktif!'));
app.listen(PORT, () => console.log(`Web sunucusu aktif.`));

bot.sendMessage(CHAT_ID, `🤖 15 Dakikalık (15m) SMC Kurumsal Sinyal Botu Başladı\n\nStrateji: Order Block + Fair Value Gap (FVG)\nZaman Dilimi: 15 Dakika (15m)`);

// Binance Vadeli İşlemlerden En Hacimli İlk 50 Coini Çeker
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

// SMC Algoritma Motoru
async function smcStratejiTara() {
    try {
        const symbols = await getFuturesSymbols();
        
        for (const symbol of symbols) {
            // Analiz için son 30 mumu çekiyoruz
            const res = await axios.get(`https://binance.com{symbol}&interval=15m&limit=30`);
            
            // Mum verilerini anlamlandırıyoruz
            const mumlar = res.data.map(m => ({
                open: parseFloat(m[1]),
                high: parseFloat(m[2]),
                low: parseFloat(m[3]),
                close: parseFloat(m[4])
            }));

            if (mumlar.length < 5) continue;

            const sonIndeks = mumlar.length - 1;
            const anlikFiyat = mumlar[sonIndeks].close;

            // 1. ADIM: FVG (Fair Value Gap - Fiyat Boşluğu) Tespiti
            // Boğa FVG: 1. mumun tepesi, 3. mumun dibinin altındaysa arada boşluk kalmıştır
            const bullishFVG = mumlar[sonIndeks - 2].high < mumlar[sonIndeks].low;
            // Ayı FVG: 1. mumun dibi, 3. mumun tepesinin üzerindeyse aşağı yönlü boşluk vardır
            const bearishFVG = mumlar[sonIndeks - 2].low > mumlar[sonIndeks].high;

            // 2. ADIM: Order Block (Kurumsal Emir Bloğu) Tespiti
            // Bullish OB: Sert yükselişten önceki son düşüş mumu (Kurumsal alım bölgesi)
            const bullishOB = mumlar[sonIndeks - 1].close > mumlar[sonIndeks - 1].open && mumlar[sonIndeks - 2].close < mumlar[sonIndeks - 2].open;
            // Bearish OB: Sert düşüşten önceki son yükseliş mumu (Kurumsal satış bölgesi)
            const bearishOB = mumlar[sonIndeks - 1].close < mumlar[sonIndeks - 1].open && mumlar[sonIndeks - 2].close > mumlar[sonIndeks - 2].open;

            let yön = null;
            let stop = 0, hedef = 0;
            let sinyalMaddeleri = [];

            // LONG SINYAL TETIKLENME ŞARTI (OB + FVG UYUMU)
            if (bullishOB && bullishFVG) {
                yön = "🟢 LONG";
                stop = mumlar[sonIndeks - 2].low; // Zarar kes en dip iğne ucu
                const riskMesafesi = anlikFiyat - stop;
                
                if (riskMesafesi > 0) {
                    hedef = anlikFiyat + (riskMesafesi * 2.05); // Tam 2.05R Risk/Reward kazanç hedefi
                    sinyalMaddeleri = [
                        "- Fiyat yükseliş trendinde",
                        "- Bullish FVG (Fiyat Boşluğu) yakalandı",
                        "- Bullish Order Block (Kurumsal Alım Bölgesi)"
                    ];
                }
            }
            // SHORT SINYAL TETIKLENME ŞARTI (OB + FVG UYUMU)
            else if (bearishOB && bearishFVG) {
                yön = "🔴 SHORT";
                stop = mumlar[sonIndeks - 2].high; // Zarar kes en tepe iğne ucu
                const riskMesafesi = stop - anlikFiyat;
                
                if (riskMesafesi > 0) {
                    hedef = anlikFiyat - (riskMesafesi * 2.05); // Tam 2.05R Risk/Reward kazanç hedefi
                    sinyalMaddeleri = [
                        "- Fiyat düşüş trendinde",
                        "- Bearish FVG (Fiyat Boşluğu) yakalandı",
                        "- Bearish Order Block (Kurumsal Satış Bölgesi)"
                    ];
                }
            }

            // Eğer bir SMC yapısı oluşmuşsa videodaki tasarımla Telegram'a gönder
            if (yön && hedef > 0 && stop > 0) {
                const temizIsim = symbol;
                const stopYuzdesi = ((Math.abs(anlikFiyat - stop) / anlikFiyat) * 100).toFixed(2);
                
                let mesaj = `⚡ YENİ KRİPTO SİNYALİ ⚡\n` +
                            `───────────────────\n` +
                            `📌 Coin: ${temizIsim}\n` +
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

// Botun her 15 dakikada bir (15 * 60 * 1000 ms) mum kapanışlarında tarama yapmasını sağlıyoruz
setInterval(smcStratejiTara, 15 * 60 * 1000);
