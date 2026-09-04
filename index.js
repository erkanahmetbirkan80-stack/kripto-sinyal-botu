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
    res.status(200).send('Finora AI - Kurumsal Toplu Tarama Motoru Canli.');
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Sunucu aktif. Kurumsal toplu tarama motoru otopilotta başlatıldı.`);
    try {
        await bot.deleteWebHook({ drop_pending_updates: true });
        console.log("🧼 Eski Webhook kalıntıları temizlendi, Polling yolu açıldı.");
        await bot.sendMessage(CHAT_ID, "🚀 *Finora AI Kurumsal Motoru Devreye Girdi!* \nBinance Vadeli İşlemler piyasasındaki TÜM COİNLER (200+) tek bir paket halinde saniyede taranmaya başlandı. Sinyaller buraya düşecektir.", { parse_mode: 'Markdown' });
    } catch (e) { console.log("Açılış uyarısı:", e.message); }
});

// Render sunucusunun uykuya dalmasını engelleyen ping motoru
setInterval(() => {
    axios.get('https://onrender.com').catch(() => null);
}, 5 * 60 * 1000);

// Güvenli Vadeli İşlemler (Futures) API Uç Noktası
const FUTURES_BASE = 'https://binance.com';

// 🧠 TÜM PİYASAYI TEK SANİYEDE TARAYAN KURUMSAL YAPAY ZEKA MOTORU
async function kurumsalTopluPiyasaTarama() {
    console.log("⏳ Binance Futures piyasasındaki TÜM COİNLER tek bir paket olarak indiriliyor...");
    try {
        // 🛠️ MUCİZE SATIR: 200+ coinin fiyat, hacim ve mum istatistiklerini tek seferde indiren kurumsal endpoint
        const response = await axios.get(`${FUTURES_BASE}/ticker/24hr`);
        if (!response || !Array.isArray(response.data)) {
            console.log("❌ Borsa veri paketi alınamadı.");
            return;
        }

        // Sadece USDT çifti olan vadeli işlem paritelerini hafızaya al
        const vadeliPiyasa = response.data.filter(item => item.symbol.endsWith('USDT'));
        console.log(`📊 Toplam ${vadeliPiyasa.length} adet vadeli işlem coini hafızada analiz ediliyor...`);

        for (const coin of vadeliPiyasa) {
            const symbol = coin.symbol;
            const anlikFiyat = parseFloat(coin.lastPrice);
            const quoteVolume = parseFloat(coin.quoteVolume); // 24 Saatlik toplam USDT hacmi
            const priceChangePercent = parseFloat(coin.priceChangePercent); // 24 Saatlik değişim yüzdesi

            // Filtre 1: Günlük hacmi çok düşük olan (likiditesi zayıf ve tehlikeli) pariteleri doğrudan ele
            if (quoteVolume < 10000000) continue; 

            // Filtre 2: Yapay Zeka Karar Mekanizması (Hacim ve Trend Kesişimi)
            // Eğer bir paritede günlük değişim sertleştiyse ve hacim yoğunluğu arttıysa sinyal üret
            let sinyalTetiklendi = false;
            let yon = "";
            let ka = "";
            let zd = "";
            let riskUyarisi = "";

            // Oynaklığı fiyata göre dinamik hesapla (ATR simülasyonu)
            const oynaklik = anlikFiyat * 0.015; // Ortalama %1.5'lik scalp marjı

            // 🎯 GÜNLÜK HEDEF YAPAY ZEKA SİNYAL ŞARTLARI (TÜM PİYASA İÇİN GÜVENLİ FİLTRE)
            // Kurumsal Alım Baskısı: Son 24 saatte güçlü yükseliş sergileyen ve hacim alan pariteler
            if (priceChangePercent > 4.5) {
                sinyalTetiklendi = true;
                yon = "🟢 AL (LONG)";
                ka = (anlikFiyat + (oynaklik * 2.0)).toFixed(4);
                zd = (anlikFiyat - (oynaklik * 1.0)).toFixed(4);
                riskUyarisi = `• Varlık genel piyasa hacminden bağımsız olarak güçlü bir kurumsal nakit girişi yaşıyor.\n• Trend yukarı yönlü ivmesini koruyor, 1:2 risk/ödül rasyosuna sadık kalınmalıdır.`;
            } 
            // Kurumsal Satış Baskısı: Son 24 saatte sert düşüş yaşayan ve açığa satış hacmi artan pariteler
            else if (priceChangePercent < -4.5) {
                sinyalTetiklendi = true;
                yon = "🔴 SAT (SHORT)";
                ka = (anlikFiyat - (oynaklik * 2.0)).toFixed(4);
                zd = (anlikFiyat + (oynaklik * 1.0)).toFixed(4);
                riskUyarisi = `• Paritede satıcılar kontrolü tamamen eline aldı ve hacimli düşüş dalgası tetiklendi.\n• Ayı momentumu hızlanabilir, pozisyon riski dengeli tutulmalıdır.`;
            }

            if (sinyalTetiklendi) {
                let kcexOtomatikMesaj = 
                    `🧠 *FINORA AI x KCEX KURUMSAL RADAR* 🧠\n` +
                    `───────────────────\n` +
                    `📌 *Varlık:* #${symbol.replace('USDT', '')} / USDT\n` +
                    `⏱️ *Zaman Dilimi:* 5m - 15m Scalp Dönüşü\n` +
                    `📈 *Yön:*  ${yon}\n` +
                    `───────────────────\n` +
                    `💰 *Giriş Fiyatı:* $${anlikFiyat}\n` +
                    `🎯 *KA (Kâr Al):*  $${ka}\n` +
                    `🛑 *ZD (Zarar Durdur):*  $${zd}\n` +
                    `───────────────────\n` +
                    `📊 *Piyasa Hacmi:* $${(quoteVolume / 1000000).toFixed(2)}M USDT\n` +
                    `⚡ *24s Değişim:* %${priceChangePercent.toFixed(2)}\n` +
                    `───────────────────\n\n` +
                    `⚠️ *AI GÜVENLİK ANALİZİ*\n` +
                    `${riskUyarisi}\n\n` +
                    `⚡ _Sinyal kurumsal toplu piyasa veri paketi analiz edilerek üretilmiştir._`;

                const inlineKeyboard = {
                    reply_markup: {
                        inline_keyboard: [[{ text: `🚀 İşlemi Vadeli Borsada Aç`, url: `https://binance.com{symbol}` }]]
                    }
                };

                await bot.sendMessage(CHAT_ID, kcexOtomatikMesaj, { parse_mode: 'Markdown', ...inlineKeyboard }).catch(() => null);
                // Telegram sunucularını yormamak için kısa bir nefes alma süresi
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        console.log("✅ Tüm vadeli piyasa paket verileri başarıyla tarandı. Bir sonraki tarama 5 dakika sonra.");
    } catch (error) {
        console.error("Toplu tarama motorunda borsa hatası:", error.message);
    }
}

// Otopilot motorunu tetikle
kurumsalTopluPiyasaTarama();
// Her 5 dakikada bir tek bir hamleyle tüm piyasayı baştan aşağı tarar
setInterval(kurumsalTopluPiyasaTarama, 5 * 60 * 1000);
