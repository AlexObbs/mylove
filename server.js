require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize Stripe with proper error handling
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Configure CORS for both local development and production
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});
// Example Express.js backend endpoints

// In your server.js
app.post('/store-booking', async (req, res) => {
    try {
        console.log('Received booking data:', req.body);
        
        if (!req.body.userId) {
            throw new Error('Missing userId in booking data');
        }

        const bookingData = req.body;
        
        // Add server timestamp
        bookingData.serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
        
        // Create a new document in 'pending-bookings' collection
        const bookingRef = await db.collection('pending-bookings').add(bookingData);
        
        console.log('Successfully stored booking with ID:', bookingRef.id);
        
        res.json({ 
            success: true,
            bookingId: bookingRef.id 
        });
    } catch (error) {
        console.error('Detailed error in store-booking:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            success: false,
            error: error.message,
            errorDetails: error.stack
        });
    }
});

// Add CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        // Add your production domain when you deploy
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true
};


// Update verify-payment endpoint
app.post('/verify-payment', async (req, res) => {
    try {
        const { sessionId, bookingId } = req.body;
        
        // Verify payment with Stripe
        const paymentData = await stripe.checkout.sessions.retrieve(sessionId);
        
        // Get booking data from your database
        const bookingData = await db.bookings.findById(bookingId);
        
        res.json({ paymentData, bookingData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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
