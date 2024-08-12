const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');

require('dotenv').config();
const app = express();
app.use(bodyParser.json());
const CARDCOM_TERMINAL_NUMBER = process.env.CARDCOM_TERMINAL_NUMBER;
const CARDCOM_API_NAME = process.env.CARDCOM_API_NAME;
const CARDCOM_API_PASSWORD = process.env.CARDCOM_API_PASSWORD;

async function createCardcomPaymentRequest(paymentData) {
    try {
        const response = await axios.post('https://secure.cardcom.solutions/api/v11/LowProfile/Create', {
            TerminalNumber: CARDCOM_TERMINAL_NUMBER,
            ApiName: CARDCOM_API_NAME,
            ApiPassword: CARDCOM_API_PASSWORD,
            ReturnValue: paymentData.transactionId,
            Amount: paymentData.amount,
            SuccessRedirectUrl: process.env.SUCCESS_REDIRECT_URL,
            FailedRedirectUrl: process.env.FAILED_REDIRECT_URL,
            WebHookUrl: process.env.WEBHOOK_URL,
            Language: 'he',
            CoinID: 1,
            Document: {
                To: paymentData.contact.name,
                Email: paymentData.contact.email,
                Products: [
                    {
                        Description: "Transaction " + paymentData.transactionId,
                        UnitCost: paymentData.amount
                    }
                ]
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating Cardcom payment request:', error);
        throw error;
    }
}
app.post('/create-payment', async (req, res) => {
    try {
        const ghlPaymentData = req.body;
        const cardcomResponse = await createCardcomPaymentRequest(ghlPaymentData);
        res.json({
            success: true,
            paymentUrl: cardcomResponse.LowProfileUrl,
            cardcomTransactionId: cardcomResponse.InternalDealNumber
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
app.post('/cardcom-webhook', (req, res) => {
    const webhookData = req.body;
    console.log('Received webhook from Cardcom:', webhookData);
    res.sendStatus(200);
});
app.post('/verify-payment', async (req, res) => {
    const { transactionId, chargeId } = req.body;
    res.json({ success: true, message: "Payment verified successfully" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});