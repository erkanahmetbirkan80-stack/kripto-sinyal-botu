const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const { HttpsProxyAgent } = require('https-proxy-agent'); // Proxy tünel kütüphanesi

const TOKEN = '8974920211:AAH0FIFByn3035f94CPexmAirl_-FT3h1x8';
const CHAT_ID = '7547417448';

// ✅ WEBSHARE PANELİNDEKİ AKTİF BİLGİLERİNİZ MİLİMETRİK ENTEGRE EDİLDİ
const PROXY_IP = '31.59.20.176';
const PROXY_PORT = '6754';
const PROXY_USER = 'xciaaybm';
const PROXY_PASS = 'd61694enfdzv';

// Güvenli Proxy Tünel Bağlantısı oluşturuluyor
const proxyUrl = `http://${PROXY_USER}:${PROXY_PASS}@${PROXY_IP}:${PROXY_PORT}`;
const agent = new HttpsProxyAgent(proxyUrl);

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('Finora AI Engine Canli - Londra Proxy Tuneli Aktif.');
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Sunucu aktif. Proxy tüneli başlatıldı.`);
    try {
        await bot.deleteWebHook({ drop_pending_updates: true });
        console.log("🧼 Eski Webhook kalıntıları temizlendi.");
        await bot.sendMessage(CHAT_ID, "🚀 *Finora AI Londra Proxy Motoru Devrede!* \nBinance IP blokajı güvenli tünelle kırıldı. Sinyaller bu ekrana düşecektir.", { parse_mode: 'Markdown' });
    } catch (e) { console.log(e.message); }
});

// Render sunucusunun uykuya dalmasını engelleyen ping motoru
setInterval(() => {
    axios.get('https://onrender.com').catch(() => null);
}, 5 * 60 * 1000);

const FUTURES_BASE = 'https://binance.com';

// 🧠 HAFİFLETİLMİŞ VE KİLİTLENMEYEN TOPLU TARAMA MOTORU
async function kurumsalHafifPiyasaTarama() {
    console.log("⏳ Vadeli piyasa verileri Londra proxy tüneli üzerinden indiriliyor...");
    try {
        // 🔥 KESİN ÇÖZÜM: İstek Axios'a proxy agent parametresiyle teslim edilerek IP engeli aşılıyor
        const response = await axios.get(`${FUTURES_BASE}/premiumIndex`, {
            httpAgent: agent,
            httpsAgent: agent,
            timeout: 12000 // 12 saniye zaman aşımı güvencesi
        });

        if (!response || !Array.isArray(response.data)) {
            console.log("❌ Borsa veri paketi alınamadı (Proxy tüneli borsa kapısına ulaşamadı).");
            return;
        }

        const vadeliPiyasa = response.data.filter(item => item.symbol.endsWith('USDT'));
        console.log(`📊 Toplam ${vadeliPiyasa.length} adet varlık Londra tüneli içinde analiz ediliyor...`);

        // Yapay zekanın anlık tarayacağı en likit ve hareketli elit pariteler
        const elitSecimListesi = [
            'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'AVAXUSDT', 'LINKUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT',
            'DOGEUSDT', 'SHIBUSDT', 'SUIUSDT', 'APTUSDT', 'OPUSDT', 'ARBUSDT', 'NEARUSDT', 'INJUSDT', 'LTCUSDT',
            'BCHUSDT', 'FETUSDT', 'RENDERUSDT', 'WIFUSDT', 'PEPEUSDT', 'FLOKIUSDT', 'BONKUSDT', 'TONUSDT', 'FTMUSDT',
            'TIAUSDT', 'ATOMUSDT', 'XLMUSDT', 'TRXUSDT', 'UNIUSDT', 'LDOUSDT', 'SEIUSDT', 'GALAUSDT', 'ORDIUSDT'
        ];

        for (const coin of vadeliPiyasa) {
            const symbol = coin.symbol;
            if (!elitSecimListesi.includes(symbol)) continue;

            const anlikFiyat = parseFloat(coin.markPrice);
            const fundingRate = parseFloat(coin.lastFundingRate); // Balina fonlama oranı baskısı

            let sinyalTetiklendi = false;
            let yon = ""; let ka = ""; let zd = ""; let riskUyarisi = "";
            const oynaklik = anlikFiyat * 0.018; // %1.8'lik ideal scalp marjı

            // 🎯 YAPAY ZEKA STRATEJİ MATRİSİ (Fonlama Oranı Dönüşleri)
            if (fundingRate < 0.00005) {
                sinyalTetiklendi = true; yon = "🟢 AL (LONG)";
                ka = (anlikFiyat + (oynaklik * 2.5)).toFixed(4);
                zd = (anlikFiyat - (oynaklik * 1.2)).toFixed(4);
                riskUyarisi = `• Varlık vadeli tarafta kurumsal alıcıların marjin desteğiyle akümüle oluyor.\n• Fonlama dengesi LONG yönlü momentumu onaylıyor. 1:2 risk/ödül rasyosuna sadık kalınmalıdır.`;
            } 
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
                    `⚡ _Sinyal kurumsal temiz proxy tüneli kullanılarak üretilmiştir._`;

                const inlineKeyboard = {
                    reply_markup: {
                        inline_keyboard: [[{ text: `🚀 İşlemi Vadeli Borsada Aç`, url: `https://binance.com{symbol}` }]]
                    }
                };

                await bot.sendMessage(CHAT_ID, kcexOtomatikMesaj, { parse_mode: 'Markdown', ...inlineKeyboard }).catch(() => null);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        console.log("✅ Proxy tüneliyle piyasa verileri başarıyla tarandı. Yeni döngü 5 dakika sonra.");
    } catch (error) {
        console.error("Toplu tarama hatası (Proxy reddetti):", error.message);
    }
}

// Otopilot kurumsal taramayı başlat
kurumsalHafifPiyasaTarama();
setInterval(kurumsalHafifPiyasaTarama, 5 * 60 * 1000);
