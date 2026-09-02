const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express'); // Render'ın port hatası vermemesi için eklendi

// Sizin Bot Token ve Chat ID bilgileriniz doğrudan eklenmiştir
const TOKEN = '8974920211:AAG8xJ4CaUtdmmSeqV0McSqtLhBpv9VZQPg';
const CHAT_ID = '7547417448';

const bot = new TelegramBot(TOKEN, { polling: true });

// Render web hizmeti kontrolü (Hata almamak için zorunlu alan)
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot aktif ve 7/24 calisiyor!'));
app.listen(PORT, () => console.log(`Web sunucusu ${PORT} portunda baslatildi.`));

// Botun calistigini dogrulamak icin Telegram'a mesaj atıyoruz
bot.sendMessage(CHAT_ID, "🚀 Binance Sinyal Botu Render üzerinde tamamen ÜCRETSİZ planda baslatildi! Takip yapiliyor...");

async function kriptoTakipEt() {
    try {
        const response = await axios.get('https://binance.com');
        const fiyati = parseFloat(response.data.price);
        console.log(`Anlık BTC Fiyatı: $${fiyati}`);
    } catch (error) {
        console.error("Binance verisi çekilemedi:", error.message);
    }
}

setInterval(kriptoTakipEt, 60000);
