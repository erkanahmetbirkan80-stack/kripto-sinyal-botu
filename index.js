const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const TOKEN = '8974920211:AAH0FIFByn3035f94CPexmAirl_-FT3h1x8';
const CHAT_ID = '7547417448';
const RENDER_URL = 'https://onrender.com'; 

const bot = new TelegramBot(TOKEN, { polling: false });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Telegram Webhook Mesaj Yakalayıcı
app.post(`/bot${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.status(200).send('Finora AI Tarzi Interaktif Scalp Motoru Canli.');
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
    try {
        await bot.setWebHook(`${RENDER_URL}/bot${TOKEN}`);
        console.log("⚡ Telegram Webhook başarıyla bağlandı! Çakışma hatası kalıcı olarak çözüldü.");
    } catch (e) {
        console.log("Webhook kurulum hatası:", e.message);
    }
});

// UYUMAYI ENGELLEYEN PİNG MOTORU
setInterval(() => {
    axios.get(RENDER_URL).then(() => {
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

// 🔥 KESİN DÜZELTME: Webhook modunda kayıpsız çalışan garantili kelime yakalama mimarisi
bot.onText(/\/analiz (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    
    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "⚠️ Lütfen analiz etmek istediğiniz sembolü belirtin.\nÖrnek: `/analiz SOL`").catch(() => null);
    }
    
    // match[1] dizideki saf parametreyi hatasız çeker
    let gelenCoin = match[1].toUpperCase().trim(); 
    
    if (!gelenCoin.endsWith('USDT')) {
        gelenCoin = gelenCoin + 'USDT';
    }

    bot.sendMessage(chatId, `🤖 *Finora Engine:* ${gelenCoin} için canlı borsa verileri indiriliyor, teknik yapay zeka analizi başlatıldı...`, { parse_mode: 'Markdown' }).catch(() => null);

    try {
        const url = `${SPOT_BASE}/klines?symbol=${gelenCoin}&interval=5m&limit=100`;
        const res = await axios.get(url);
        
        if (!res || !Array.isArray(res.data) || res.data.length < 50) {
            return bot.sendMessage(chatId, `❌ *Hata:* ${gelenCoin} sembolü Binance üzerinde bulunamadı veya veri çekilemedi.`);
        }

        const kapanislar = res.data.map(m => parseFloat(m[4])); 
        const sonIdx = kapanislar.length - 1;
        const anlikFiyat = kapanislar[sonIdx];

        const rsiDegeri = hesaplaRSI(kapanislar, 14);
        const ema20Degeri = hesaplaEMA(kapanislar, 20);

        let trendDurumu = anlikFiyat > ema20Degeri ? "📈 YÜKSELİŞ TRENDİ (Fiyat EMA 20 Üstünde)" : "📉 DÜŞÜŞ TRENDİ (Fiyat EMA 20 Altında)";
        let rsiYorumu = "Neutral ⚖️ (Yatay Piyasa)";
        if (rsiDegeri < 35) rsiYorumu = "Aşırı Satım 🟢 (Dip Bölgesi / Alım Fırsatı)";
        if (rsiDegeri > 65) rsiYorumu = "Aşırı Alım 🔴 (Tepe Bölgesi / Satış Baskısı)";

        let sinyalDurumu = "⏳ Koşullar Nötr. Canlı kırılım veya aşırı bölge kesişimi bekleniyor.";
        if (rsiDegeri < 35 && anlikFiyat > ema20Degeri) sinyalDurumu = "🚀 GÜÇLÜ LONG POTANSİYELİ! RSI Dipte ve fiyat EMA 20 üzerine kırdı.";
        if (rsiDegeri > 65 && anlikFiyat < ema20Degeri) sinyalDurumu = "⚠️ GÜÇLÜ SHORT POTANSİYELİ! RSI Tepede ve fiyat EMA 20 altına kırdı.";

        let raporMesaji = `🤖 *FINORA AI ÖZEL TEKNİK RAPORU* 🤖\n` +
                          `───────────────────\n` +
                          `📌 *Varlık:* ${gelenCoin}\n` +
                          `⏱️ *Zaman Dilimi:* 5 Dakika (Scalp)\n` +
                          `💰 *Anlık Canlı Fiyat:* $${anlikFiyat}\n` +
                          `───────────────────\n` +
                          `📊 *Trend Algoritması:* \n` +
                          `${trendDurumu}\n\n` +
                          `🔍 *İndikatör Analizleri:* \n` +
                          `• RSI (14): ${rsiDegeri.toFixed(2)} -> ${rsiYorumu}\n` +
                          `• EMA (20): $${ema20Degeri.toFixed(5)}\n` +
                          `───────────────────\n` +
                          `🎯 *Yapay Zeka Sinyal Özeti:* \n` +
                          `${sinyalDurumu}`;

        bot.sendMessage(chatId, raporMesaji, { parse_mode: 'Markdown' }).catch(() => null);

    } catch (error) {
        bot.sendMessage(chatId, `❌ *Hata:* ${gelenCoin} verileri işlenirken borsa hatası alındı. Sembolün Binance'de listeli olduğundan emin olun.`).catch(() => null);
    }
});

// ARKA PLANDA SESSİZ ÇALIŞAN 7/24 OTOMATİK TARAMA MOTORU
async function scalpStratejiTara() {
    try {
        const symbols = await getTopSymbols();
        for (const symbol of symbols) {
            await uykuModu(500); 
            const res = await axios.get(`${SPOT_BASE}/klines?symbol=${symbol}&interval=5m&limit=100`).catch(() => null);
            if (!res || !Array.isArray(res.data) || res.data.length < 50) continue;

            const kapanislar = res.data.map(m => parseFloat(m[4])); 
            const sonIdx = kapanislar.length - 1;
            const anlikFiyat = kapanislar[sonIdx];

            if (isNaN(anlikFiyat) || anlikFiyat <= 0) continue;

            const rsiDegeri = hesaplaRSI(kapanislar, 14);
            const ema20Degeri = hesaplaEMA(kapanislar, 20);

            if (isNaN(rsiDegeri) || isNaN(ema20Degeri)) continue;

            let yon = null; let stop = 0; let hedef = 0;
            if (rsiDegeri < 35 && anlikFiyat > ema20Degeri) {
                yon = "🟢 LONG (ALIM)"; stop = anlikFiyat * 0.9925; hedef = anlikFiyat * 1.0150;
            } else if (rsiDegeri > 65 && anlikFiyat < ema20Degeri) {
                yon = "🔴 SHORT (SATIM)"; stop = anlikFiyat * 1.0075; hedef = anlikFiyat * 0.9850;
            }

            if (yon) {
                let mesaj = `⚡ *YENİ SCALP SİNYALİ* ⚡\n───────────────────\n📌 *Coin:* ${symbol}\n📊 *Yön:* ${yon}\n⏱️ *Varlık Dilimi:* 5 Dakika\n───────────────────\n🎯 *Giriş Fiyatı:* ${anlikFiyat}\n🛑 *Stop Seviyesi:* ${stop.toFixed(5)}\n💰 *Kâr Hedefi:* ${hedef.toFixed(5)}\n───────────────────\n🔍 *Göstergeler:*\n- RSI (14): ${rsiDegeri.toFixed(2)}\n- EMA (20): ${ema20Degeri.toFixed(5)}`;
                bot.sendMessage(CHAT_ID, mesaj, { parse_mode: 'Markdown' }).catch(() => null);
            }
        }
    } catch (error) { console.error("Tarama hatası:", error.message); }
}

scalpStratejiTara();
setInterval(scalpStratejiTara, 5 * 60 * 1000);
