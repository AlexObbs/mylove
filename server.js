require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Add debug logging for the Stripe key
console.log('Stripe Key Status:', process.env.STRIPE_SECRET_KEY ? 'Present' : 'Missing');

// Initialize Stripe with explicit error handling
let stripe;
try {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe secret key is missing');
    }
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} catch (error) {
    console.error('Stripe initialization error:', error);
}

const app = express();

app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

app.use(express.json());

// Add debug endpoint to check environment variables
app.get('/debug-env', (req, res) => {
    res.json({
        stripeKeyExists: !!process.env.STRIPE_SECRET_KEY,
        stripeKeyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) : null
    });
});

app.post('/create-checkout-session', async (req, res) => {
    try {
        if (!stripe) {
            throw new Error('Stripe is not properly initialized');
        }

        const { packageId, userId, amount } = req.body;
        console.log('Received request:', { packageId, userId, amount });

        const timestamp = Date.now();

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: 'Travel Package Booking',
                    },
                    unit_amount: amount * 100,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `http://localhost:5500/payment-success.html?session_id={CHECKOUT_SESSION_ID}&userId=${userId}&timestamp=${timestamp}`,
            cancel_url: `http://localhost:5500/payment-cancelled.html?userId=${userId}&timestamp=${timestamp}`,
            client_reference_id: userId,
            metadata: {
                userId: userId,
                timestamp: timestamp.toString(),
                packageId: packageId
            }
        });

        res.json({ 
            id: session.id,
            timestamp: timestamp 
        });
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({ 
            error: error.message,
            type: error.type,
            stripeKeyExists: !!process.env.STRIPE_SECRET_KEY
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment check on startup:', {
        stripeKeyExists: !!process.env.STRIPE_SECRET_KEY,
        nodeEnv: process.env.NODE_ENV
    });
});
