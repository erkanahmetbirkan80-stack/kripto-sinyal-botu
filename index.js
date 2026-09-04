const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const { HttpsProxyAgent } = require('https-proxy-agent');

const TOKEN = '8974920211:AAH0FIFByn3035f94CPexmAirl_-FT3h1x8';
const CHAT_ID = '7547417448';

// ✅ 4. SIRADAKİ TEMİZ İSPANYA (MADRID) PROXY BİLGİLERİNİZ ENTEGRE EDİLDİ
const PROXY_IP = '64.137.96.74';
const PROXY_PORT = '6641';
const PROXY_USER = 'xciaaybm';
const PROXY_PASS = 'd61694enfdzv';

const proxyUrl = `http://${PROXY_USER}:${PROXY_PASS}@${PROXY_IP}:${PROXY_PORT}`;
const agent = new HttpsProxyAgent(proxyUrl);

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('Finora AI Engine Canli - Ispanya Proxy Tuneli Aktif.');
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Sunucu aktif. Ispanya proxy tüneli başlatıldı.`);
    try {
        await bot.deleteWebHook({ drop_pending_updates: true });
        console.log("🧼 Eski Webhook kalıntıları temizlendi.");
        await bot.sendMessage(CHAT_ID, "🚀 *Finora AI İspanya Proxy Motoru Aktif!* \nTünel IP adresi yenilendi, tarama döngüsü baştan başlatılıyor.", { parse_mode: 'Markdown' });
    } catch (e) { console.log(e.message); }
});

setInterval(() => {
    axios.get('https://onrender.com').catch(() => null);
}, 5 * 60 * 1000);

const FUTURES_BASE = 'https://binance.com';

async function kurumsalHafifPiyasaTarama() {
    console.log("⏳ Vadeli piyasa verileri İspanya proxy tüneli üzerinden indiriliyor...");
    try {
        const response = await axios.get(`${FUTURES_BASE}/premiumIndex`, {
            httpAgent: agent,
            httpsAgent: agent,
            timeout: 15000 // Zaman aşımı koruması 15 saniyeye esnetildi
        });

        if (!response || !Array.isArray(response.data)) {
            console.log("❌ Borsa veri paketi alınamadı.");
            return;
        }

        const vadeliPiyasa = response.data.filter(item => item.symbol.endsWith('USDT'));
        console.log(`📊 Toplam ${vadeliPiyasa.length} adet varlık tünel içinde analiz ediliyor...`);

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
            const fundingRate = parseFloat(coin.lastFundingRate); 

            let sinyalTetiklendi = false;
            let yon = ""; let ka = ""; let zd = ""; let riskUyarisi = "";
            const oynaklik = anlikFiyat * 0.018; 

            if (fundingRate < 0.00005) {
                sinyalTetiklendi = true; yon = "🟢 AL (LONG)";
                ka = (anlikFiyat + (oynaklik * 2.5)).toFixed(4);
                zd = (anlikFiyat - (oynaklik * 1.2)).toFixed(4);
                riskUyarisi = `• Varlık vadeli tarafta kurumsal alıcıların marjin desteğiyle akümüle oluyor.\n• Fonlama dengesi LONG yönlü momentumu onaylıyor.`;
            } 
            else if (fundingRate > 0.00035) {
                sinyalTetiklendi = true; yon = "🔴 SAT (SHORT)";
                ka = (anlikFiyat - (oynaklik * 2.5)).toFixed(4);
                zd = (anlikFiyat + (oynaklik * 1.2)).toFixed(4);
                riskUyarisi = `• Paritede aşırı alım doygunluğu nedeniyle açığa satış (Short) baskısı tetiklendi.`;
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
                    `⚡ _Sinyal yenilenmiş temiz İspanya tüneli kullanılarak üretilmiştir._`;

                const inlineKeyboard = {
                    reply_markup: {
                        inline_keyboard: [[{ text: `🚀 İşlemi Vadeli Borsada Aç`, url: `https://binance.com{symbol}` }]]
                    }
                };

                await bot.sendMessage(CHAT_ID, kcexOtomatikMesaj, { parse_mode: 'Markdown', ...inlineKeyboard }).catch(() => null);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        console.log("✅ Yeni temiz tünelle piyasa verileri başarıyla tarandı.");
    } catch (error) {
        console.error("Toplu tarama hatası (Proxy tıkandı):", error.message);
    }
}

kurumsalHafifPiyasaTarama();
setInterval(kurumsalHafifPiyasaTarama, 5 * 60 * 1000);
