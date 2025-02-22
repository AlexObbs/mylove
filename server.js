/ server.js
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

app.use(cors(corsOptions));
app.use(express.json());

// Initialize Firebase Admin with the correct service account structure
try {
    const serviceAccount = {
        type: "service_account",
        project_id: "trial-17319",  // Make sure this matches your Firebase project ID
        private_key_id: "9ee398f4acc2932a8e39eea5b27d0c20ad1eb4da",
        private_key: process.env.FIREBASE_PRIVATE_KEY 
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            : "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCHk9BVmWLhsQd4\nEYbUKOF8rnDocyvrIoZ4dno+sUe62DMvhG6ibyVxpKnkCcMalBg3BmjW+dENX2tZ\nwADH3YqH3d2hVOd+EuYjQtxWxAS73jhx36sLPp+c3+kp2YU20CXJc5vz/mmrAIGA\nTD1cJBQQrNp7rFkNUHcrHV3YDM7opyqGgEnTdCr/tdhebchKLKOt3bTut/+zMSFS\nrCLY9Q3a8rpOfrOvu3LK5YfBojOTWQN1rdle3JYTOhcQMbPbDCfobIR9kRX5GPUF\nv5AbBnQ7S6OIM/PbC+na7Vag7WZf7r4sWGrgb9s3HhJq6V1jIJFjIjlqn7lUtddJ\nIg7TjtDbAgMBAAECggEAFk4NMmf/yp2zWt+XTQRExJx2WufHy/FsKhlj1ziXUngL\nQ8AH65VZla6/fJLWlGLU8QiO6v9Ck26lXKin+DnMdrnbopUzWJyHXDm9wlCRbs8K\nfkGMBFeTLt3voED3F6N68/+fIq8ydz2oEJF6btRIsM2fTEV4iSY51NAKBmdlCwVo\nPbd9Y9Y1iqZ5kijbsh4qfYE2VkJlwcscj5bfMzmgkyCtCL3lOexPRUftDq4Uclf8\nXYWSJHnJ9NVs/Pv6KNzNctQcuIakFDn/g5Nddz8GyRz7N3DOJc4SRKIR9d+c6Cp4\ndBebNh2TJq6GhWzlOKc0epF/pni+k2vRNxa7kFaPIQKBgQC8c4mbtITAk22naJC2\ne3/yVce84POg7twNmosYyJm+Pd9fkJ+9vSmiKlh/mbbX6Y6xCWKl9d0xp5Al6YQW\n0GnOX0sY+WuD3/YWuNW/zkifHT92vvdkvzsSi+OZYsMfe0UFXhXFxK+eXvqQdG7G\nBXl+kvZaXatLPzVclnKX5gXt8wKBgQC4LISLL81uG0UBIFqUd5ZoOP07cyIn3jEf\nDUkxtn4TbiETANo2fG8fFav8LMiSNxmbkGKSeiRTmHVUxKScf87ifuJGCL6O2Tes\ncx5/v4E9KDcYTzITAwXJbQqgnBqKVFGSeH+KDDRDxW/KPQ7IDN4tsikQfByIAfm+\nrV4/P4qDeQKBgQCiTTN3uXoXzSFEbAcuUqD4Gi7DGk5ZDT7SLIadmq7mrK0Dxi/9\nnrwLoULE6qMRw2IUUQv3+Q8+45x/OmV7rJVjmqi34qBZXHq6SQg2gDgFaZAt+fxh\ndV0v9PDZOrjoFSd1nvlLccD6ubw8yzpYK4DepT2syD1tuguAKUaaUg5LRwKBgAsP\noWY6mLvkJ2DJ8Ka6B+56fbr0TzjVv11+DsdNjoTcOGBLzM846fOT+aBLkEA3zvHo\n2gKyEzxyC5nrtXcwtdwkgrJyE//AS/evckV52ukxYR20o+1AYTiXs+uxdGaaacvC\nMOa5lOn9EZmz0Q9ytmVILe8vhQcmFzm8b8ycpFUBAoGAePgtoBxKxSe+of2eWYZj\nz3XT1XjQZES/5uiAXp1Q7pDtAqRMtA30rtVKZjF2He8hmGCvGWM/35CKsaIS7nQt\nI1/szxSDoAxoYsAUcdJ/MaEvT8P6RZmubEs1aiyc6PprvBwr/6lM9/JNNYjZz3rU\n8yJLRj+A93whXzjNzCfnAwo=\n-----END PRIVATE KEY-----\n",
        client_email: "firebase-adminsdk-fbsvc@trial-17319.iam.gserviceaccount.com",
        client_id: "105218357354604939181",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40trial-17319.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
    };

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized successfully');
    }
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
