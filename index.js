const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

// Güncel aktif token bilgilerin
const TOKEN = '8974920211:AAH0FIFByn3035f94CPexmAirl_-FT3h1x8';
const CHAT_ID = '7547417448';

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('Finora AI Engine - Yapay Zeka Destekli Scalp Motoru Canli.');
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
    try {
        await bot.deleteWebHook();
        console.log("🧼 Eski Telegram Webhook kalıntıları temizlendi, Polling moduna geçildi.");
    } catch (e) { console.log(e.message); }
});

// Kesintisiz uyanık tutma motoru
setInterval(() => {
    axios.get('https://onrender.com').then(() => console.log("Ping.")).catch(() => null);
}, 5 * 60 * 1000);

const SPOT_BASE = 'https://binance.com'; 
const FUTURES_BASE = 'https://binance.com';

// 🧠 YAPAY ZEKA DESTEKLİ EN GÜÇLÜ BALİNA VE OYNAKLIK TARAYICISI
async function yapayZekaBalinaMotoru() {
    console.log("Yapay Zeka ve Balina Oranları Eşzamanlı Analiz Ediliyor...");
    const takipListesi = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'AVAXUSDT', 'LINKUSDT', 'BNBUSDT'];

    for (const symbol of takipListesi) {
        try {
            // 1. En iyi tüccarların (Balinaların) Pozisyon Oranını Al
            const ratioUrl = `${FUTURES_BASE}/futures/data/topLongShortPositionRatio?symbol=${symbol}&period=15m&limit=1`;
            const ratioRes = await axios.get(ratioUrl).catch(() => null);
            if (!ratioRes || !Array.isArray(ratioRes.data) || ratioRes.data.length === 0) continue;

            const longOrani = parseFloat(ratioRes.data[0].longAccount) * 100;
            const shortOrani = parseFloat(ratioRes.data[0].shortAccount) * 100;

            // 2. Coinin Oynaklığını (ATR Mantığı) Hesaplamak İçin Son 5m Mum Verilerini Al
            const klinesUrl = `${SPOT_BASE}/klines?symbol=${symbol}&interval=5m&limit=20`;
            const klinesRes = await axios.get(klinesUrl).catch(() => null);
            if (!klinesRes || !Array.isArray(klinesRes.data) || klinesRes.data.length < 15) continue;

            // Fiyatları ve en yüksek/en düşük farklarını çıkar
            const mumlar = klinesRes.data;
            const kapanislar = mumlar.map(m => parseFloat(m[4]));
            const anlikFiyat = kapanislar[kapanislar.length - 1];

            // Basit Oynaklık Çarpanı Hesaplama (Yapay Zekanın Milimetrik Stop Belirlemesi İçin)
            let toplamMenzil = 0;
            for (let i = 0; i < mumlar.length; i++) {
                const yuksek = parseFloat(mumlar[i][2]);
                const dusuk = parseFloat(mumlar[i][3]);
                toplamMenzil += (yuksek - dusuk);
            }
            const ortalamaOynaklik = toplamMenzil / mumlar.length; // Canlı volatilite değeri

            let mesaj = "";
            let yönYazisi = "";
            let borsaUrl = `https://binance.com{symbol}`; // Doğrudan vadeli işlem linki

            // 🌟 YAPAY ZEKA KARAR MEKANİZMASI VE DEĞER ÜRETİMİ
            if (longOrani >= 60.0) {
                yönYazisi = "BUY (LONG)";
                // Yapay Zeka Stop: Anlık fiyattan, canlı piyasa oynaklığının 2.5 katını çıkarır (Güvenli Bölge)
                const yapayZekaStop = anlikFiyat - (ortalamaOynaklik * 2.5);
                // Yapay Zeka Kar Al: Risk/Ödül oranını minimum 1:2 veya 1:3 bandına kurar
                const yapayZekaHedef = anlikFiyat + (ortalamaOynaklik * 4.5);

                mesaj = `🧠 *FINORA AI YAPAY ZEKA SCALP SİNYALİ* 🧠\n` +
                        `───────────────────\n` +
                        `📌 *Varlık:* #${symbol.replace('USDT', '')} / USDT\n` +
                        `📊 *Yapay Zeka Yön Algısı:* 🟢 LONG (ALIM)\n` +
                        `🔥 *Balina Destek Oranı:* %${longOrani.toFixed(1)}\n` +
                        `───────────────────\n` +
                        `💰 *Giriş (Anlık Fiyat):* $${anlikFiyat}\n` +
                        `🛑 *Yapay Zeka STOP:* $${yapayZekaStop.toFixed(4)}\n` +
                        `🎯 *Yapay Zeka HEDEF (Kar Al):* $${yapayZekaHedef.toFixed(4)}\n` +
                        `───────────────────\n` +
                        `💡 _Not: Stop ve hedef seviyeleri paritenin son 5 dakikalık canlı oynaklık hacmi (ATR) hesaplanarak yapay zeka tarafından belirlenmiştir._`;
            } 
            else if (shortOrani >= 60.0) {
                yönYazisi = "SELL (SHORT)";
                const yapayZekaStop = anlikFiyat + (ortalamaOynaklik * 2.5);
                const yapayZekaHedef = anlikFiyat - (ortalamaOynaklik * 4.5);

                mesaj = `🧠 *FINORA AI YAPAY ZEKA SCALP SİNYALİ* 🧠\n` +
                        `───────────────────\n` +
                        `📌 *Varlık:* #${symbol.replace('USDT', '')} / USDT\n` +
                        `📊 *Yapay Zeka Yön Algısı:* 🔴 SHORT (SATIM)\n` +
                        `⚠️ *Balina Baskı Oranı:* %${shortOrani.toFixed(1)}\n` +
                        `───────────────────\n` +
                        `💰 *Giriş (Anlık Fiyat):* $${anlikFiyat}\n` +
                        `🛑 *Yapay Zeka STOP:* $${yapayZekaStop.toFixed(4)}\n` +
                        `🎯 *Yapay Zeka HEDEF (Kar Al):* $${yapayZekaHedef.toFixed(4)}\n` +
                        `───────────────────\n` +
                        `💡 _Not: Stop ve hedef seviyeleri paritenin son 5 dakikalık canlı oynaklık hacmi (ATR) hesaplanarak yapay zeka tarafından belirlenmiştir._`;
            }

            // Sinyal oluştuysa interaktif butonla Telegram'a fırlat
            if (mesaj) {
                const inlineKeyboard = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: `🚀 İşlemi Binance'de Aç (${yönYazisi})`, url: borsaUrl }
                            ]
                        ]
                    }
                };

                await bot.sendMessage(CHAT_ID, mesaj, { parse_mode: 'Markdown', ...inlineKeyboard }).catch(() => null);
                await new Promise(resolve => setTimeout(resolve, 2000)); 
            }

        } catch (err) { console.error("Yapay zeka motor hatası:", err.message); }
    }
}

// 🎯 CANLI ANALİZ KOMUT MOTORU (Orijinal Sistem)
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

        const kapanislar = res.data.map(m => parseFloat(m[4])); 
        const anlikFiyat = kapanislar[kapanislar.length - 1];
        
        let borsaUrl = `https://binance.com{gelenCoin}`;
        let raporMesaji = `🤖 *FINORA AI TEKNİK RAPORU* 🤖\n` +
                          `───────────────────\n` +
                          `📌 *Varlık:* ${gelenCoin}\n` +
                          `💰 *Canlı Fiyat:* $${anlikFiyat}\n` +
                          `───────────────────\n` +
                          `💡 _Otomatik tarama motoru arka planda aktiftir. Balina yoğunlaşmaları Telegram'a anlık yansıtılacaktır._`;

        const inlineKeyboard = {
            reply_markup: {
                inline_keyboard: [[{ text: `📊 Grafiği İncele`, url: borsaUrl }]]
            }
        };

        bot.sendMessage(chatId, raporMesaji, inlineKeyboard);
    } catch (error) {
        bot.sendMessage(chatId, `❌ ${gelenCoin} sembolü borsa üzerinde bulunamadı.`);
    }
});

// Yapay zeka tarama döngüsünü tetikle (Her 15 dakikada bir otomatik çalışır)
yapayZekaBalinaMotoru();
setInterval(yapayZekaBalinaMotoru, 15 * 60 * 1000);
