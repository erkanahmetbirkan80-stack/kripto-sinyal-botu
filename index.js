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

// Telegram Webhook Veri Giriş Kapısı
app.post(`/bot${TOKEN}`, (req, res) => {
    res.sendStatus(200);
    if (req.body && req.body.message) {
        const msg = req.body.message;
        const text = msg.text;
        const chatId = msg.chat.id;

        if (text && text.startsWith('/analiz')) {
            // Mesajı boşluklara göre böl: /analiz SOL 1s
            const parcalar = text.split(/\s+/);
            const coinParam = parcalar[1] ? parcalar[1].trim() : '';
            const vadeParam = parcalar[2] ? parcalar[2].trim().toLowerCase() : '1s'; // Varsayılan 1 saat
            
            kcexYapalyZekaMotoru(chatId, coinParam, vadeParam);
        }
    } else {
        bot.processUpdate(req.body);
    }
});

app.get('/', (req, res) => {
    res.status(200).send('KCEX Yapay Zeka Analiz Altyapisi Canli.');
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Sunucu aktif.`);
    try {
        await bot.deleteWebHook();
        await bot.setWebHook(`${RENDER_URL}/bot${TOKEN}`);
    } catch (e) { console.log(e.message); }
});

setInterval(() => { axios.get(RENDER_URL).catch(() => null); }, 5 * 60 * 1000);

const SPOT_BASE = 'https://binance.com';

// 📊 GELİŞMİŞ MATEMATİKSEL İNDİKATÖR HESAPLAYICILARI
function hesaplaEMA(kapanislar, periyot) {
    if (kapanislar.length < periyot) return kapanislar[kapanislar.length - 1];
    const k = 2 / (periyot + 1);
    let ema = kapanislar.slice(0, periyot).reduce((a, b) => a + b, 0) / periyot;
    for (let i = periyot; i < kapanislar.length; i++) { ema = (kapanislar[i] * k) + (ema * (1 - k)); }
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
    return ortalamaKayip === 0 ? 100 : 100 - (100 / (1 + (ortalamaKazanc / ortalamaKayip)));
}

// 🧠 KCEX STİLİ ÇOKLU ZAMAN DİLİMLİ YAPAY ZEKA MOTORU
async function kcexYapalyZekaMotoru(chatId, coinParam, vadeParam) {
    if (!coinParam) {
        return bot.sendMessage(chatId, "⚠️ *Eksik Komut Girdiniz!*\n\nLütfen analiz türünü zaman dilimiyle belirtin:\n👉 `15m` (15 Dakika)\n👉 `1s` (1 Saat)\n👉 `4s` (4 Saat)\n👉 `1g` (Günlük)\n\n*Örnek Kullanım:* `/analiz SOL 15m` veya `/analiz BTC 4s`", { parse_mode: 'Markdown' }).catch(() => null);
    }

    let gelenCoin = coinParam.toUpperCase().trim();
    if (!gelenCoin.endsWith('USDT')) gelenCoin += 'USDT';

    // Zaman dilimi ve borsa interval eşleştirmesi
    let interval = '1h';
    let vadeYazisi = '🕒 Gün İçinde (1 Saatlik Görünüm)';
    
    if (vadeParam === '15m') { interval = '15m'; vadeYazisi = '⏱️ Kısa Vadeli (15 Dakikalık Görünüm)'; }
    else if (vadeParam === '4s') { interval = '4h'; vadeYazisi = '📊 Orta Vadeli (4 Saatlik Görünüm)'; }
    else if (vadeParam === '1g') { interval = '1d'; vadeYazisi = '📅 Uzun Vadeli (Günlük Görünüm)'; }

    bot.sendMessage(chatId, `🤖 *KCEX AI Modeli:* ${gelenCoin} için veriler alınıyor...`).catch(() => null);

    try {
        const url = `${SPOT_BASE}/klines?symbol=${gelenCoin}&interval=${interval}&limit=100`;
        const res = await axios.get(url);
        if (!res || !Array.isArray(res.data) || res.data.length < 30) {
            return bot.sendMessage(chatId, `❌ *Hata:* ${gelenCoin} verisi borsa sunucularından çekilemedi.`);
        }

        const mumlar = res.data;
        const kapanislar = mumlar.map(m => parseFloat(m[4]));
        const enYuksekler = mumlar.map(m => parseFloat(m[2]));
        const enDusukler = mumlar.map(m => parseFloat(m[3]));
        
        const anlikFiyat = kapanislar[kapanislar.length - 1];

        // Gösterge Değerlerini Hesapla
        const rsi = hesaplaRSI(kapanislar, 14);
        const ema20 = hesaplaEMA(kapanislar, 20);

        // Volatilite (Oynaklık ölçümü - ATR simülasyonu)
        let toplamMenzil = 0;
        for(let i=mumlar.length-10; i<mumlar.length; i++) { toplamMenzil += (enYuksekler[i] - enDusukler[i]); }
        const oynaklik = toplamMenzil / 10;

        // 🌟 KCEX YAPAY ZEKA STRATEJİ KARAR MATRİSİ
        let yon = "NÖTR";
        let girisNoktası = "";
        let ka = ""; // Kar Al
        let zd = ""; // Zarar Durdur
        let riskUyarisi = "";

        if (anlikFiyat > ema20 && rsi > 45) {
            yon = "AL (LONG)";
            girisNoktası = `${(anlikFiyat * 0.999).toFixed(4)} - ${(anlikFiyat * 1.001).toFixed(4)}`;
            ka = (anlikFiyat + (oynaklik * 3.5)).toFixed(4);
            zd = (anlikFiyat - (oynaklik * 2.0)).toFixed(4);
            
            riskUyarisi = `• Seçilen zaman diliminde fiyat EMA 20 seviyesinin üzerinde tutunarak gücünü koruyor.\n` +
                          `• RSI indikatörünün yukarı yönlü ivmelenmesi, alıcıların iştahlı olduğunu göstermektedir.\n` +
                          `• Ani kar satışları veya direnç bölgelerinden gelebilecek tepkilere karşı stop-loss (ZD) seviyesine riayet edilmelidir.\n` +
                          `• Pozisyon boyutu piyasa oynaklığı gözetilerek dengeli tutulmalıdır.`;
        } else {
            yon = "SAT (SHORT)";
            girisNoktası = `${(anlikFiyat * 0.999).toFixed(4)} - ${(anlikFiyat * 1.001).toFixed(4)}`;
            ka = (anlikFiyat - (oynaklik * 3.5)).toFixed(4);
            zd = (anlikFiyat + (oynaklik * 2.0)).toFixed(4);
            
            riskUyarisi = `• Kısa vadeli aşırı satım bölgesinde RSI indikatörünün dipten yukarı dönüş çabası, beklenmedik anlık bir fiyat sıçramasına neden olabilir.\n` +
                          `• ${interval === '15m' ? '15 dakikalık' : 'Daha büyük'} grafikteki zayıf toparlanma sinyalleri, ana düşüş trendine karşı koyamayabilir. Bu nedenle pozisyon boyutu küçük tutulmalıdır.\n` +
                          `• Kripto para piyasasındaki genel oynaklık ve ani haber akışları stop seviyenizi ihlal edebilir, temkinli olunmalıdır.`;
        }

        // 📊 KCEX BORSASI TASARIMINDA TELEGRAM MESAJI
        let kcexRaporMesaji = 
            `💡 *TERCİH ETTİĞİNİZ ELDE TUTMA SÜRESİ*\n` +
            `└─ ${vadeYazisi}\n\n` +
            `📊 *ALIM-SATIM ÖNERİSİ*\n` +
            `───────────────────\n` +
            `• *Yön:*  ${yon === "AL (LONG)" ? '🟢 AL' : '🔴 SAT'}\n` +
            `• *Giriş Noktası:*  ${girisNoktası}\n` +
            `• *KA (Kâr Al):*  ${ka}\n` +
            `• *ZD (Zarar Durdur):*  ${zd}\n` +
            `───────────────────\n\n` +
            `⚠️ *RİSK UYARISI*\n` +
            `${riskUyarisi}\n\n` +
            `⚡ _Finora AI x KCEX Analiz Motoru_`;

        const inlineKeyboard = {
            reply_markup: {
                inline_keyboard: [[{ text: `🚀 İşlemi Vadeli Borsada Aç`, url: `https://binance.com{gelenCoin}` }]]
            }
        };

        bot.sendMessage(chatId, kcexRaporMesaji, { parse_mode: 'Markdown', ...inlineKeyboard }).catch(() => null);

    } catch (error) {
        bot.sendMessage(chatId, `❌ Analiz sırasında bir sorun oluştu. Lütfen sembolü kontrol edin.`).catch(() => null);
    }
}
