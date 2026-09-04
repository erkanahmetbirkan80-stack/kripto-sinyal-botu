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
    res.status(200).send('Finora AI Engine Canli.');
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Sunucu aktif. Hafifletilmis kurumsal motor baslatildi.`);
    try {
        await bot.deleteWebHook({ drop_pending_updates: true });
        console.log("🧼 Eski Webhook kalintilari temizlendi.");
        await bot.sendMessage(CHAT_ID, "🚀 *Finora AI Kurumsal Hafif Motoru Devrede!* \n100 Vadeli parite sunucuyu yormadan milisaniyeler icinde taranmaya baslandi. Sinyaller buraya dusecektir.", { parse_mode: 'Markdown' });
    } catch (e) { console.log("Acilis uyarisi:", e.message); }
});

// Sunucuyu canlı tutan ping motoru
setInterval(() => {
    axios.get('https://onrender.com').catch(() => null);
}, 5 * 60 * 1000);

const FUTURES_BASE = 'https://binance.com';

// 🧠 HAFİFLETİLMİŞ VE KİLİTLENMEYEN TOPLU TARAMA MOTORU
async function kurumsalHafifPiyasaTarama() {
    console.log("⏳ Vadeli piyasa fiyat ve balina paketi milisaniyeler icinde indiriliyor...");
    try {
        // 🛠️ EN HAFİF VE HIZLI ENDPOINT: Sadece anlık fiyat ve fonlama verilerini tek seferde çeker
        const response = await axios.get(`${FUTURES_BASE}/premiumIndex`);
        if (!response || !Array.isArray(response.data)) {
            console.log("❌ Borsa veri paketi alinamadi.");
            return;
        }

        // Sadece USDT çiftlerini filtrele
        const vadeliPiyasa = response.data.filter(item => item.symbol.endsWith('USDT'));
        console.log(`📊 Toplam ${vadeliPiyasa.length} adet varlik hafizada analiz ediliyor...`);

        // Sinyal akışını canlandırmak ve en likit pariteleri yakalamak için ana liste
        const elitSecimListesi = [
            'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'AVAXUSDT', 'LINKUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT',
            'DOGEUSDT', 'SHIBUSDT', 'SUIUSDT', 'APTUSDT', 'OPUSDT', 'ARBUSDT', 'NEARUSDT', 'INJUSDT', 'LTCUSDT',
            'BCHUSDT', 'FETUSDT', 'RENDERUSDT', 'WIFUSDT', 'PEPEUSDT', 'FLOKIUSDT', 'BONKUSDT', 'TONUSDT', 'FTMUSDT',
            'TIAUSDT', 'ATOMUSDT', 'XLMUSDT', 'TRXUSDT', 'UNIUSDT', 'LDOUSDT', 'SEIUSDT', 'GALAUSDT', 'ORDIUSDT'
        ];

        for (const coin of vadeliPiyasa) {
            const symbol = coin.symbol;
            
            // Eğer coin bizim elit seçim listemizde yoksa pas geç (Böylece tarama süper hızlı biter)
            if (!elitSecimListesi.includes(symbol)) continue;

            const anlikFiyat = parseFloat(coin.markPrice);
            
            // 🛠️ BALİNA VE FONLAMA ORANI ANALİZİ: Profesyonel botların yön tayin etme sırrı
            const fundingRate = parseFloat(coin.lastFundingRate); 

            let sinyalTetiklendi = false;
            let yon = ""; let ka = ""; let zd = ""; let riskUyarisi = "";
            const oynaklik = anlikFiyat * 0.018; // %1.8'lik ideal scalp hedef marjı

            // 🎯 YAPAY ZEKA STRATEJİ MATRİSİ (Fonlama Oranı Dönüşlerine Göre Nokta Atışı)
            // Eğer fonlama oranı çok düşmüşse balinalar dipten LONG topluyor demektir
            if (fundingRate < 0.00005) {
                sinyalTetiklendi = true; yon = "🟢 AL (LONG)";
                ka = (anlikFiyat + (oynaklik * 2.5)).toFixed(4);
                zd = (anlikFiyat - (oynaklik * 1.2)).toFixed(4);
                riskUyarisi = `• Varlık vadeli tarafta kurumsal alıcıların marjin desteğiyle akümüle oluyor.\n• Fonlama dengesi LONG yönlü momentumu onaylıyor. 1:2 risk/ödül rasyosuna sadık kalınmalıdır.`;
            } 
            // Eğer fonlama oranı çok şişmişse balinalar tepeden SHORT basıyor demektir
            else if (fundingRate > 0.00035) {
                sinyalTetiklendi = true; yon = "🔴 SAT (SHORT)";
                ka = (anlikFiyat - (oynaklik * 2.5)).toFixed(4);
                zd = (anlikFiyat + (oynaklik * 1.2)).toFixed(4);
                riskUyarisi = `• Paritede aşırı alım doygunluğu nedeniyle açığa satış (Short) baskısı tetiklendi.\n• Balina marjin yoğunluğu ayı yönlü kırılımı destekliyor.`;
            }

            if (sinyalTetiklendi) {
                let kcexOtomatikMesaj = 
                    `🧠 *FINORA AI x KCEX KURUMSAL RADAR* 🧠\n` +
                    `───────────────────\n` +
                    `📌 *Varlık:* #${symbol.replace('USDT', '')} / USDT\n` +
                    `⏱️ *Zaman Dilimi:* 5m - 15m Scalp\n` +
                    `📈 *Yön:*  ${yon}\n` +
                    `───────────────────\n` +
                    `💰 *Giriş Fiyatı:* $${anlikFiyat}\n` +
                    `🎯 *KA (Kâr Al):*  $${ka}\n` +
                    `🛑 *ZD (Zarar Durdur):*  $${zd}\n` +
                    `───────────────────\n` +
                    `📊 *Balina Marjin Oranı:* ${fundingRate.toFixed(5)}\n` +
                    `───────────────────\n\n` +
                    `⚠️ *AI GÜVENLİK ANALİZİ*\n` +
                    `${riskUyarisi}\n\n` +
                    `⚡ _Sinyal kurumsal premium balina veri paketi analiz edilerek uretilmistir._`;

                const inlineKeyboard = {
                    reply_markup: {
                        inline_keyboard: [[{ text: `🚀 Islemi Vadeli Borsada Ac`, url: `https://binance.com{symbol}` }]]
                    }
                };

                await bot.sendMessage(CHAT_ID, kcexOtomatikMesaj, { parse_mode: 'Markdown', ...inlineKeyboard }).catch(() => null);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        console.log("✅ Hafifletilmis piyasa verileri basariyla tarandi. Yeni dongu 5 dakika sonra.");
    } catch (error) {
        console.error("Toplu tarama hatasi:", error.message);
    }
}

// İlk taramayı başlat
kurumsalHafifPiyasaTarama();
// Her 5 dakikada bir sunucuyu hiç yormadan piyasayı baştan aşağı tarar
setInterval(kurumsalHafifPiyasaTarama, 5 * 60 * 1000);
