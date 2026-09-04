const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

// ✅ Güncel ve çakışmasız token bilgileriniz
const TOKEN = '8974920211:AAH0FIFByn3035f94CPexmAirl_-FT3h1x8';
const CHAT_ID = '7547417448';

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('Finora AI - 5 Dakikalik Hizli Scalp & Esnek RSI Motoru Aktif.');
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Sunucu aktif. 100 Parite 5m hızlı scalp tarayıcısı başlatıldı.`);
    try {
        await bot.deleteWebHook();
    } catch (e) { null; }
});

// Render sunucusunun uykuya dalmasını engelleyen ping motoru
setInterval(() => {
    axios.get('https://onrender.com').catch(() => null);
}, 5 * 60 * 1000);

const SPOT_BASE = 'https://binance.com';

// 📊 MATEMATİKSEL İNDİKATÖR FONKSİYONLARI
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

// 🧠 5 DAKİKALIK OTOMATİK KCEX YAPAY ZEKA TARAYICI MOTORU
async function otomatikScalpTara() {
    console.log("⏳ 100 Elit paritede 5m canlı mumlar taranıyor...");
    
    const takipListesi = [
        'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'AVAXUSDT', 
        'LINKUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT', 'MATICUSDT',
        'DOGEUSDT', 'SHIBUSDT', 'SUIUSDT', 'APTUSDT', 'OPUSDT',
        'ARBUSDT', 'NEARUSDT', 'INJUSDT', 'LTCUSDT', 'BCHUSDT',
        'FETUSDT', 'RENDERUSDT', 'WIFUSDT', 'PEPEUSDT', 'FLOKIUSDT',
        'BONKUSDT', 'TONUSDT', 'STXUSDT', 'FTMUSDT', 'TIAUSDT',
        'ATOMUSDT', 'XLMUSDT', 'TRXUSDT', 'UNIUSDT', 'FILUSDT',
        'LDOUSDT', 'SEIUSDT', 'SNDUSDT', 'MANAUSDT',
        'GALAUSDT', 'AXSUSDT', 'APEUSDT', 'GMTUSDT', 'GRTUSDT',
        'AAVEUSDT', 'MKRUSDT', 'COMPUSDT', 'CRVUSDT', 'SUSHIUSDT',
        'DYDXUSDT', 'RUNEUSDT', 'EGLDUSDT', 'THETAUSDT', 'ALGOUSDT',
        'IMXUSDT', 'FLOWUSDT', 'CHZUSDT', 'ONEUSDT',
        'ANKRUSDT', 'LRCUSDT', 'ZILUSDT', 'JASMYUSDT', 'ENSUSDT',
        'ICPUSDT', 'MINAUSDT', 'WOOUSDT', 'STGUSDT', 'MAGICUSDT',
        'DYMUSDT', 'PYTHUSDT', 'JUPUSDT', 'WUSDT', 'ENAUSDT',
        'STRKUSDT', 'ZKUSDT', 'IOUSDT',
        'NOTUSDT', 'BOMEUSDT', 'MEMEUSDT', 'TURBOUSDT', '1000SATSUSDT',
        'PEOPLEUSDT', 'POPCATUSDT', 'MEWUSDT', 'BRETTUSDT', 'MYROUSDT',
        'ORDIUSDT', '1000RATSUSDT', 'ARKMUSDT', 'ALTUSDT', 'MANTAUSDT',
        'XAIUSDT', 'AIUSDT', 'NFPUSDT', 'CYBERUSDT', 'YGGUSDT'
    ];

    const benzersizListe = [...new Set(takipListesi)];

    for (const symbol of benzersizListe) {
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); 

            // 🛠️ DÜZELTİLDİ: Zaman dilimi interval=5m olarak güncellendi
            const url = `${SPOT_BASE}/klines?symbol=${symbol}&interval=5m&limit=100`;
            const res = await axios.get(url).catch(() => null);
            if (!res || !Array.isArray(res.data) || res.data.length < 40) continue;

            const kapanislar = res.data.map(m => parseFloat(m[4]));
            const enYuksekler = res.data.map(m => parseFloat(m[2]));
            const enDusukler = res.data.map(m => parseFloat(m[3]));
            
            const anlikFiyat = kapanislar[kapanislar.length - 1];
            const rsi = hesaplaRSI(kapanislar, 14);
            const ema20 = hesaplaEMA(kapanislar, 20);

            let toplamMenzil = 0;
            for (let i = res.data.length - 10; i < res.data.length; i++) {
                toplamMenzil += (enYuksekler[i] - enDusukler[i]);
            }
            const oynaklik = toplamMenzil / 10;

            let sinyalTetiklendi = false;
            let yon = "";
            let ka = "";
            let zd = "";
            let riskUyarisi = "";

            // 🛠️ DÜZELTİLDİ: RSI Koşulları esnetildi (LONG için < 46, SHORT için > 54 yapıldı)
            if (rsi < 46 && anlikFiyat > ema20) {
                sinyalTetiklendi = true;
                yon = "🟢 AL (LONG)";
                ka = (anlikFiyat + (oynaklik * 3.2)).toFixed(4);
                zd = (anlikFiyat - (oynaklik * 1.6)).toFixed(4);
                riskUyarisi = `• Varlık 5 dakikalık grafikte RSI toparlanma ivmesiyle birlikte EMA 20 üzerine güçlü yerleşti.\n• Scalp momentum onaylandı, belirlenen hedefler takip edilmelidir.`;
            } 
            else if (rsi > 54 && anlikFiyat < ema20) {
                sinyalTetiklendi = true;
                yon = "🔴 SAT (SHORT)";
                ka = (anlikFiyat - (oynaklik * 3.2)).toFixed(4);
                zd = (anlikFiyat + (oynaklik * 1.6)).toFixed(4);
                riskUyarisi = `• Varlık 5m scalp zaman diliminde direnç yiyerek EMA 20 altına sarktı, RSI satıcı baskısını doğruluyor.\n• Hızlı düşüş dalgasına karşı stop-loss seviyesi korunmalıdır.`;
            }

            if (sinyalTetiklendi) {
                let kcexOtomatikMesaj = 
                    `🧠 *FINORA AI x KCEX 5M HIZLI SCALP* 🧠\n` +
                    `───────────────────\n` +
                    `📌 *Varlık:* #${symbol.replace('USDT', '')} / USDT\n` +
                    `⏱️ *Zaman Dilimi:* 5 Dakika (Hızlı Scalp)\n` +
                    `📈 *Yön:*  ${yon}\n` +
                    `───────────────────\n` +
                    `💰 *Giriş Fiyatı:* $${anlikFiyat}\n` +
                    `🎯 *KA (Kâr Al):*  $${ka}\n` +
                    `🛑 *ZD (Zarar Durdur):*  $${zd}\n` +
                    `───────────────────\n\n` +
                    `⚠️ *AI RİSK ANALİZİ*\n` +
                    `${riskUyarisi}\n\n` +
                    `⚡ _Sinyal yapay zeka tarafından 5m esnek RSI verileriyle üretilmiştir._`;

                const inlineKeyboard = {
                    reply_markup: {
                        inline_keyboard: [[{ text: `🚀 İşlemi Vadeli Borsada Aç`, url: `https://binance.com{symbol}` }]]
                    }
                };

                await bot.sendMessage(CHAT_ID, kcexOtomatikMesaj, { parse_mode: 'Markdown', ...inlineKeyboard }).catch(() => null);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

        } catch (error) { null; }
    }
    console.log("✅ 100 Parite 5m grafikte başarıyla tarandı. 5 dakika sonra sonraki döngü başlayacak.");
}

// Bot tetiklendiği an ilk tarama başlar
otomatikScalpTara();

// 🛠️ DÜZELTİLDİ: Tarama periyodu 5 dakikaya indirildi (5 * 60 * 1000)
setInterval(otomatikScalpTara, 5 * 60 * 1000);
