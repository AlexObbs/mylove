require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize Stripe with proper error handling
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Configure CORS for both local development and production
app.use(cors({
    origin: ['https://alexobbs.github.io'],
    credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Create checkout session endpoint
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { packageId, userId, amount } = req.body;
        
        if (!userId || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const timestamp = Date.now();

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: 'Travel Package Booking',
                    },
                    unit_amount: amount * 100, // Convert to pence
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `https://alexobbs.github.io/lover/payment-success.html?session_id={CHECKOUT_SESSION_ID}&userId=${userId}&timestamp=${timestamp}`,
            cancel_url: `https://alexobbs.github.io/lover/payment-cancelled.html?userId=${userId}&timestamp=${timestamp}`,
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

// Verify payment endpoint
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

// Handle cancellation endpoint
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

// Get booking status endpoint
app.get('/booking-status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // You can add Firebase or database integration here if needed
        res.json({ 
            status: 'success',
            message: 'Booking status retrieved',
            userId
        });
    } catch (error) {
        console.error('Error getting booking status:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
