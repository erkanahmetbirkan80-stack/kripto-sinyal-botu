const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const TOKEN = '8974920211:AAH0FIFByn3035f94CPexmAirl_-FT3h1x8';
const CHAT_ID = '7547417448';
const RENDER_URL = 'https://onrender.com'; // Sizin Render URL'niz

// 🛠️ POLLING KAPATILDI, WEBHOOK MODUNA GEÇİLDİ (Çakışmayı önlemek için kesin çözüm)
const bot = new TelegramBot(TOKEN, { polling: false });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Telegram'dan gelen anlık mesajları yakalayan kapı (Endpoint)
app.post(`/bot${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.status(200).send('Finora AI Yapay Zeka ve Balina Motoru Webhook Modunda Canli.');
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
    try {
        // Eski kalıntıları temizle ve Telegram'a yeni webhook adresini bildir
        await bot.deleteWebHook();
        await bot.setWebHook(`${RENDER_URL}/bot${TOKEN}`);
        console.log("⚡ Telegram Webhook başarıyla bağlandı! Çakışma hatası kalıcı olarak imha edildi.");
    } catch (e) {
        console.log("Webhook kurulum hatası:", e.message);
    }
});

// Sunucuyu uyanık tutan ping motoru
setInterval(() => {
    axios.get(RENDER_URL).then(() => null).catch(() => null);
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

            const mumlar = klinesRes.data;
            const anlikFiyat = parseFloat(mumlar[mumlar.length - 1][4]); // Kapanış fiyatı (4. indeks)

            // Canlı piyasa oynaklık (volatilite) hesabı
            let toplamMenzil = 0;
            for (let i = 0; i < mumlar.length; i++) {
                const yuksek = parseFloat(mumlar[i][2]); // En yüksek (2. indeks)
                const dusuk = parseFloat(mumlar[i][3]);  // En düşük (3. indeks)
                toplamMenzil += (yuksek - dusuk);
            }
            const ortalamaOynaklik = toplamMenzil / mumlar.length; 

            let mesaj = "";
            let yönYazisi = "";
            let borsaUrl = `https://binance.com{symbol}`;

            // 🌟 YAPAY ZEKA KARAR MEKANİZMASI VE DEĞER ÜRETİMİ
            if (longOrani >= 60.0) {
                yönYazisi = "BUY (LONG)";
                const yapayZekaStop = anlikFiyat - (ortalamaOynaklik * 2.5);
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
                        `💡 _Not: Seviyeler paritenin son 5 dakikalık canlı oynaklık hacmi (ATR) hesaplanarak yapay zehir tarafından belirlenmiştir._`;
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
                        `💡 _Not: Seviyeler paritenin son 5 dakikalık canlı oynaklık hacmi (ATR) hesaplanarak yapay zehir tarafından belirlenmiştir._`;
            }

            if (mesaj) {
                const inlineKeyboard = {
                    reply_markup: {
                        inline_keyboard: [[{ text: `🚀 İşlemi Binance'de Aç (${yönYazisi})`, url: borsaUrl }]]
                    }
                };
                await bot.sendMessage(CHAT_ID, mesaj, { parse_mode: 'Markdown', ...inlineKeyboard }).catch(() => null);
                await new Promise(resolve => setTimeout(resolve, 2000)); 
            }
        } catch (err) { console.error("Yapay zeka motor hatası:", err.message); }
    }
}

// 🎯 CANLI ANALİZ KOMUT MOTORU
bot.onText(/\/analiz (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!match || !match[1]) return;
    
    let gelenCoin = match[1].toUpperCase().trim(); 
    if (!gelenCoin.endsWith('USDT')) {
        gelenCoin = gelenCoin + 'USDT';
    }

    bot.sendMessage(chatId, `🤖 *Finora Engine:* ${gelenCoin} analizi başlatıldı...`);

    try {
        const url = `${SPOT_BASE}/klines?symbol=${gelenCoin}&interval=5m&limit=5`;
        const res = await axios.get(url);
        if (!res || !Array.isArray(res.data)) return bot.sendMessage(chatId, `❌ Veri çekilemedi.`);

        const anlikFiyat = parseFloat(res.data[res.data.length - 1][4]);
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
        bot.sendMessage(chatId, raporMesaji, { parse_mode: 'Markdown', ...inlineKeyboard });
    } catch (error) {
        bot.sendMessage(chatId, `❌ ${gelenCoin} sembolü bulunamadı.`);
    }
});

// Yapay zeka tarama döngüsünü tetikle (Her 15 dakikada bir otomatik çalışır)
yapayZekaBalinaMotoru();
setInterval(yapayZekaBalinaMotoru, 15 * 60 * 1000);
