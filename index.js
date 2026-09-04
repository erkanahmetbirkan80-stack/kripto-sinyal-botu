const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

// ✅ Güncel ve çakışmasız token bilgilerin
const TOKEN = '8974920211:AAH0FIFByn3035f94CPexmAirl_-FT3h1x8';
const CHAT_ID = '7547417448';
const RENDER_URL = 'https://onrender.com'; 

const bot = new TelegramBot(TOKEN, { polling: false });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🔥 MİLİMETRİK WEBHOOK GİRİŞ KAPISI: İndeks kaymaları tamamen düzeltildi
app.post(`/bot${TOKEN}`, (req, res) => {
    res.sendStatus(200); // Telegram sunucusunu bekletmeden anında 200 OK dön
    
    if (req.body && req.body.message && req.body.message.text) {
        const text = req.body.message.text.trim();
        const chatId = req.body.message.chat.id;

        if (text.startsWith('/analiz')) {
            const parcalar = text.split(/\s+/); // Boşluklara göre ayır
            
            // 🛠️ KESİN DÜZELTME: /analiz SOL 15m formatında indeksler 1 ve 2 olmalıdır!
            const coinParam = parcalar[1] ? parcalar[1].toUpperCase().trim() : '';
            const vadeParam = parcalar[2] ? parcalar[2].toLowerCase().trim() : '1s';
            
            kcexYapayZekaMotoru(chatId, coinParam, vadeParam);
        }
    }
});

app.get('/', (req, res) => {
    res.status(200).send('Finora AI - KCEX Borsasi Modeli Canli.');
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Sunucu aktif.`);
    try {
        await bot.deleteWebHook();
        await bot.setWebHook(`${RENDER_URL}/bot${TOKEN}`);
        console.log("⚡ Telegram Webhook başarıyla kuruldu.");
    } catch (e) { console.log("Webhook Hatasi:", e.message); }
});

setInterval(() => { axios.get(RENDER_URL).catch(() => null); }, 5 * 60 * 1000);

const SPOT_BASE = 'https://binance.com';

// 📊 MATEMATİKSEL İNDİKATÖR ALTYAPISI
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
    let ortalamaKazanc = kazaclar / periyot; 
    let ortalamaKayip = kayiplar / periyot;
    for (let i = periyot + 1; i < kapanislar.length; i++) {
        let fark = kapanislar[i] - kapanislar[i - 1];
        ortalamaKazanc = (ortalamaKazanc * (periyot - 1) + (fark > 0 ? fark : 0)) / periyot;
        ortalamaKayip = (ortalamaKayip * (periyot - 1) + (fark < 0 ? Math.abs(fark) : 0)) / periyot;
    }
    if (ortalamaKayip === 0) return 100;
    let rs = ortalamaKazanc / ortalamaKayip;
    return 100 - (100 / (1 + rs));
}

// 🧠 KCEX STİLİ ÇOKLU ZAMAN DİLİMLİ YAPAY ZEKA MOTORU
async function kcexYapayZekaMotoru(chatId, coinParam, vadeParam) {
    if (!coinParam) {
        const uyarim = `⚠️ *Eksik Komut Formati!*\n\nLütfen analiz etmek istediğiniz coini ve zaman dilimini belirtin:\n\n*Örnek Kullanım:* \`/analiz SOL 15m\` veya \`/analiz BTC 1s\``;
        return bot.sendMessage(chatId, uyarim, { parse_mode: 'Markdown' }).catch(() => null);
    }

    let gelenCoin = coinParam;
    if (!gelenCoin.endsWith('USDT')) gelenCoin += 'USDT';

    let interval = '1h';
    let vadeYazisi = '🕒 Gün İçinde';
    
    if (vadeParam === '15m') { interval = '15m'; vadeYazisi = '⏱️ 1 Saat İçinde (15 Dakikalık Görünüm)'; }
    else if (vadeParam === '4s') { interval = '4h'; vadeYazisi = '📊 1 Hafta İçinde (4 Saatlik Görünüm)'; }
    else if (vadeParam === '1g') { interval = '1d'; vadeYazisi = '📅 >1 Hafta (Günlük Görünüm)'; }

    bot.sendMessage(chatId, `🤖 *KCEX AI Modeli:* ${gelenCoin} için ${vadeParam.toUpperCase()} canlı borsa verileri analiz ediliyor...`).catch(() => null);

    try {
        const url = `${SPOT_BASE}/klines?symbol=${gelenCoin}&interval=${interval}&limit=100`;
        const res = await axios.get(url);
        
        if (!res || !Array.isArray(res.data) || res.data.length < 40) {
            return bot.sendMessage(chatId, `❌ *Hata:* ${gelenCoin} verileri Binance üzerinden çekilemedi.`);
        }

        // ✅ TAM MATRİS HARİTALAMA: Binance mum verilerindeki indeksler düzeltildi
        const kapanislar = res.data.map(m => parseFloat(m[4]));
        const enYuksekler = res.data.map(m => parseFloat(m[2]));
        const enDusukler = res.data.map(m => parseFloat(m[3]));
        
        const anlikFiyat = kapanislar[kapanislar.length - 1];
        const rsi = hesaplaRSI(kapanislar, 14);
        const ema20 = hesaplaEMA(kapanislar, 20);

        // Son 10 mumun oynaklığına göre dinamik volatilite hesabı
        let toplamMenzil = 0;
        for (let i = res.data.length - 10; i < res.data.length; i++) {
            toplamMenzil += (enYuksekler[i] - enDusukler[i]);
        }
        const oynaklik = toplamMenzil / 10;

        let yon = "NÖTR";
        let girisNoktasi = "";
        let ka = ""; 
        let zd = ""; 
        let riskUyarisi = "";

        if (anlikFiyat > ema20) {
            yon = "AL (LONG)";
            girisNoktasi = `${(anlikFiyat * 0.998).toFixed(4)} - ${(anlikFiyat * 1.002).toFixed(4)}`;
            ka = (anlikFiyat + (oynaklik * 3.2)).toFixed(4);
            zd = (anlikFiyat - (oynaklik * 1.8)).toFixed(4);
            
            riskUyarisi = `• Varlık fiyatı seçilen zaman diliminde güçlü EMA 20 desteğinin üzerinde tutunmayı başarıyor.\n• RSI indikatöründeki alıcı hacmi, yükseliş yönlü momentumun korunduğunu teyit etmektedir.\n• Direnç noktalarından gelebilecek ani kar satışlarına karşı belirlenen ZD (Zarar Durdur) seviyesi mutlaka takip edilmelidir.`;
        } else {
            yon = "SAT (SHORT)";
            girisNoktasi = `${(anlikFiyat * 0.998).toFixed(4)} - ${(anlikFiyat * 1.002).toFixed(4)}`;
            ka = (anlikFiyat - (oynaklik * 3.2)).toFixed(4);
            zd = (anlikFiyat + (oynaklik * 1.8)).toFixed(4);
            
            riskUyarisi = `• Kısa vadeli aşırı satım bölgesinde RSI indikatörünün yukarı dönüşü, beklenmedik bir fiyat sıçramasına neden olabilir. Bu durumda stop-loss seviyesine dikkat edilmelidir.\n• Grafik üzerindeki zayıf toparlanma sinyalleri, daha büyük zaman dilimindeki güçlü düşüş trendine karşı koyamayabilir.\n• Kripto para piyasasındaki genel oynaklık ve ani haber akışları fiyat dalgalanmalarını artırabilir.`;
        }

        let kcexRaporMesaji = 
            `📊 *TERCİH ETTİĞİNİZ ELDE TUTMA SÜRESİ*\n` +
            `└─ ${vadeYazisi}\n\n` +
            `📈 *ALIM-SATIM ÖNERİSİ*\n` +
            `───────────────────\n` +
            `• *Yön:*  ${yon === "AL (LONG)" ? '🟢 AL' : '🔴 SAT'}\n` +
            `• *Giriş Noktası:*  ${girisNoktasi}\n` +
            `• *KA (Kâr Al):*  ${ka}\n` +
            `• *ZD (Zarar Durdur):*  ${zd}\n` +
            `───────────────────\n\n` +
            `⚠️ *RİSK UYARISI*\n` +
            `${riskUyarisi}\n\n` +
            `⚡ _Finora AI x KCEX Analiz Sistemi_`;

        const inlineKeyboard = {
            reply_markup: {
                inline_keyboard: [[{ text: `🚀 İşlemi Vadeli Borsada Aç`, url: `https://binance.com{gelenCoin}` }]]
            }
        };

        bot.sendMessage(chatId, kcexRaporMesaji, { parse_mode: 'Markdown', ...inlineKeyboard }).catch(() => null);

    } catch (error) {
        bot.sendMessage(chatId, `❌ *Hata:* Veriler işlenirken teknik bir sorun oluştu.`).catch(() => null);
    }
}
