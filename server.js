require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();

// Enable CORS for local development
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    next();
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Create checkout session
app.post('/create-checkout-session', async (req, res) => {
    try {
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
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify payment
app.post('/verify-payment', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            res.json({
                paid: true,
                amount: session.amount_total / 100,
                customerId: session.customer,
                metadata: session.metadata
            });
        } else {
            res.json({ 
                paid: false,
                status: session.payment_status,
                metadata: session.metadata
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Handle cancellation
app.post('/handle-cancellation', async (req, res) => {
    try {
        const { userId, timestamp } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        res.json({ 
            success: true,
            message: 'Cancellation processed',
            userId,
            timestamp
        });
    } catch (error) {
        console.error('Error handling cancellation:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});