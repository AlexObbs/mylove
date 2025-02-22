// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

const app = express();

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Initialize Firebase Admin
try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
            })
        });
    }
    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
}

const db = admin.firestore();

// Middleware to validate Firebase token
const validateFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'No token provided' 
            });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ 
            error: 'Invalid token' 
        });
    }
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Store booking endpoint
app.post('/store-booking', validateFirebaseToken, async (req, res) => {
    try {
        console.log('Authenticated user:', req.user);
        console.log('Received booking data:', req.body);
        
        if (!req.user.uid) {
            throw new Error('Missing userId in authenticated user data');
        }

        const bookingData = {
            ...req.body,
            userId: req.user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const bookingRef = await db.collection('pending-bookings').add(bookingData);
        
        console.log('Successfully stored booking with ID:', bookingRef.id);
        
        res.json({ 
            success: true,
            bookingId: bookingRef.id 
        });
    } catch (error) {
        console.error('Error in store-booking:', error);
        res.status(500).json({ 
            success: false,
            error: error.message
        });
    }
});

// Create checkout session endpoint
app.post('/create-checkout-session', validateFirebaseToken, async (req, res) => {
    try {
        const { packageId, amount, bookingId } = req.body;
        const userId = req.user.uid;
        
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
            success_url: `${process.env.FRONTEND_URL}/payment-success.html?session_id={CHECKOUT_SESSION_ID}&bookingId=${bookingId}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled.html?bookingId=${bookingId}`,
            client_reference_id: userId,
            metadata: {
                userId: userId,
                bookingId: bookingId,
                packageId: packageId,
                timestamp: timestamp.toString()
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
app.post('/verify-payment', validateFirebaseToken, async (req, res) => {
    try {
        const { sessionId, bookingId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session.payment_status === 'paid') {
            // Update booking status in Firestore
            await db.collection('pending-bookings').doc(bookingId).update({
                paymentStatus: {
                    status: 'paid',
                    amount: session.amount_total / 100,
                    paidAt: admin.firestore.FieldValue.serverTimestamp()
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

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

// Get booking status endpoint
app.get('/booking-status/:bookingId', validateFirebaseToken, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.uid;
        
        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }

        const bookingDoc = await db.collection('pending-bookings').doc(bookingId).get();
        
        if (!bookingDoc.exists) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const bookingData = bookingDoc.data();
        
        // Verify user owns this booking
        if (bookingData.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to booking' });
        }

        res.json({ 
            success: true,
            booking: bookingData
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
