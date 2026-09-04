const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

// ✅ Güncel ve aktif token bilgileriniz
const TOKEN = '8974920211:AAH0FIFByn3035f94CPexmAirl_-FT3h1x8';
const CHAT_ID = '7547417448';

// Polling modunu başlatıyoruz
const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('Finora AI - Kasa Motoru Tamamen Aktif.');
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Sunucu aktif. Temizlik başlatılıyor...`);
    try {
        // 🔥 KİLİDİ KIRAN EN KRİTİK SATIR: Telegram sunucularında asılı kalan eski webhook kaydını zorla siliyoruz!
        await bot.deleteWebHook({ drop_pending_updates: true });
        console.log("🧼 Eski Telegram Webhook kalıntıları dünyadan silindi! Polling yolu tamamen açıldı.");
        
        // Botun açıldığını doğrulamak için Telegram'a anında test mesajı atıyoruz
        await bot.sendMessage(CHAT_ID, "🚀 *Finora AI Otopilot Motoru Başarıyla Uyandı!* \n100 Parite 5m grafikte kurumsal filtrelerle taranmaya başlandı. Sinyaller bu ekrana düşecektir.", { parse_mode: 'Markdown' });
    } catch (e) { 
        console.log("Sıfırlama sırasında borsa/telegram uyarısı:", e.message); 
    }
});

// Sunucuyu canlı tutan ping motoru
setInterval(() => {
    axios.get('https://onrender.com').catch(() => null);
}, 5 * 60 * 1000);

const SPOT_BASE = 'https://binance.com';

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

async function otopilotKasaMotoru() {
    console.log("⏳ Günlük hedef için 100 paritede 5m mumlar taranıyor...");
    
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

            const url = `${SPOT_BASE}/klines?symbol=${symbol}&interval=5m&limit=100`;
            const res = await axios.get(url).catch(() => null);
            if (!res || !Array.isArray(res.data) || res.data.length < 50) continue;

            const kapanislar = res.data.map(m => parseFloat(m));
            const enYuksekler = res.data.map(m => parseFloat(m));
            const enDusukler = res.data.map(m => parseFloat(m));
            const hacimler = res.data.map(m => parseFloat(m)); 
            
            const anlikFiyat = kapanislar[kapanislar.length - 1];
            const sonHacim = hacimler[hacimler.length - 1];
            
            const ortalamaHacim = hacimler.slice(hacimler.length - 20).reduce((a, b) => a + b, 0) / 20;

            const rsi = hesaplaRSI(kapanislar, 14);
            const ema20 = hesaplaEMA(kapanislar, 20);

            // 1 Saatlik Trend Doğrulaması
            const url1h = `${SPOT_BASE}/klines?symbol=${symbol}&interval=1h&limit=30`;
            const res1h = await axios.get(url1h).catch(() => null);
            if (!res1h || !Array.isArray(res1h.data)) continue;
            
            const kapanislar1h = res1h.data.map(m => parseFloat(m));
            const ema20_1h = hesaplaEMA(kapanislar1h, 20);
            
            const buyukTrendLongUygun = kapanislar1h[kapanislar1h.length - 1] > ema20_1h;
            const buyukTrendShortUygun = kapanislar1h[kapanislar1h.length - 1] < ema20_1h;

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

            // %10 Esnek Hacim ve Esnek RSI Koşulları
            if (rsi < 46 && anlikFiyat > ema20 && sonHacim > (ortalamaHacim * 1.1) && buyukTrendLongUygun) {
                sinyalTetiklendi = true;
                yon = "🟢 AL (LONG)";
                ka = (anlikFiyat + (oynaklik * 3.2)).toFixed(4);
                zd = (anlikFiyat - (oynaklik * 1.6)).toFixed(4);
                riskUyarisi = `• 1 Saatlik ana trend yükseliş yönündeyken, 5m grafikte dengeli kurumsal para girişi gerçekleşti.\n• Yapay zeka büyük trend ve hacim onayını verdi.`;
            } 
            else if (rsi > 54 && anlikFiyat < ema20 && sonHacim > (ortalamaHacim * 1.1) && buyukTrendShortUygun) {
                sinyalTetiklendi = true;
                yon = "🔴 SAT (SHORT)";
                ka = (anlikFiyat - (oynaklik * 3.2)).toFixed(4);
                zd = (anlikFiyat + (oynaklik * 1.6)).toFixed(4);
                riskUyarisi = `• 1 Saatlik ana trend düşüş yönündeyken, 5m grafikte kararlı satıcı hacmi tetiklendi.\n• Büyük resim ayı yönlü momentumu destekliyor.`;
            }

            if (sinyalTetiklendi) {
                let kcexOtomatikMesaj = 
                    `🧠 *FINORA AI x KCEX HEDEF OTOPİLOT* 🧠\n` +
                    `───────────────────\n` +
                    `📌 *Varlık:* #${symbol.replace('USDT', '')} / USDT\n` +
                    `⏱️ *Zaman Dilimi:* 5 Dakika (Scalp)\n` +
                    `📈 *Yön:*  ${yon}\n` +
                    `───────────────────\n` +
                    `💰 *Giriş Fiyatı:* $${anlikFiyat}\n` +
                    `🎯 *KA (Kâr Al):*  $${ka}\n` +
                    `🛑 *ZD (Zarar Durdur):*  $${zd}\n` +
                    `───────────────────\n\n` +
                    `⚠️ *AI GÜVENLİK ANALİZİ*\n` +
                    `${riskUyarisi}\n\n` +
                    `⚡ _Sinyal 1h Büyük Trend ve 5m Kurumsal Hacim Onaylıdır._`;

                const inlineKeyboard = {
                    reply_markup: {
                        inline_keyboard: [[{ text: `🚀 İşlemi Vadeli Borsada Aç`, url: `https://binance.com{symbol}` }]]
                    }
                };

                await bot.sendMessage(CHAT_ID, kcexOtomatikMesaj, { parse_mode: 'Markdown', ...inlineKeyboard }).catch(() => null);
                await new Promise(resolve => setTimeout(resolve, 4000));
            }

        } catch (error) { null; }
    }
    console.log("✅ 100 Parite kurumsal filtrelerle tarandı. 5 dakika sonra yeni döngü başlayacak.");
}

// Otopilotu başlat
otopilotKasaMotoru();
setInterval(otopilotKasaMotoru, 5 * 60 * 1000);
