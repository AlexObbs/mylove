// server.js
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin using environment variables
try {
  const serviceAccount = {
  "type": "service_account",
  "project_id": "trial-17319",
  "private_key_id": "9ee398f4acc2932a8e39eea5b27d0c20ad1eb4da",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCHk9BVmWLhsQd4\nEYbUKOF8rnDocyvrIoZ4dno+sUe62DMvhG6ibyVxpKnkCcMalBg3BmjW+dENX2tZ\nwADH3YqH3d2hVOd+EuYjQtxWxAS73jhx36sLPp+c3+kp2YU20CXJc5vz/mmrAIGA\nTD1cJBQQrNp7rFkNUHcrHV3YDM7opyqGgEnTdCr/tdhebchKLKOt3bTut/+zMSFS\nrCLY9Q3a8rpOfrOvu3LK5YfBojOTWQN1rdle3JYTOhcQMbPbDCfobIR9kRX5GPUF\nv5AbBnQ7S6OIM/PbC+na7Vag7WZf7r4sWGrgb9s3HhJq6V1jIJFjIjlqn7lUtddJ\nIg7TjtDbAgMBAAECggEAFk4NMmf/yp2zWt+XTQRExJx2WufHy/FsKhlj1ziXUngL\nQ8AH65VZla6/fJLWlGLU8QiO6v9Ck26lXKin+DnMdrnbopUzWJyHXDm9wlCRbs8K\nfkGMBFeTLt3voED3F6N68/+fIq8ydz2oEJF6btRIsM2fTEV4iSY51NAKBmdlCwVo\nPbd9Y9Y1iqZ5kijbsh4qfYE2VkJlwcscj5bfMzmgkyCtCL3lOexPRUftDq4Uclf8\nXYWSJHnJ9NVs/Pv6KNzNctQcuIakFDn/g5Nddz8GyRz7N3DOJc4SRKIR9d+c6Cp4\ndBebNh2TJq6GhWzlOKc0epF/pni+k2vRNxa7kFaPIQKBgQC8c4mbtITAk22naJC2\ne3/yVce84POg7twNmosYyJm+Pd9fkJ+9vSmiKlh/mbbX6Y6xCWKl9d0xp5Al6YQW\n0GnOX0sY+WuD3/YWuNW/zkifHT92vvdkvzsSi+OZYsMfe0UFXhXFxK+eXvqQdG7G\nBXl+kvZaXatLPzVclnKX5gXt8wKBgQC4LISLL81uG0UBIFqUd5ZoOP07cyIn3jEf\nDUkxtn4TbiETANo2fG8fFav8LMiSNxmbkGKSeiRTmHVUxKScf87ifuJGCL6O2Tes\ncx5/v4E9KDcYTzITAwXJbQqgnBqKVFGSeH+KDDRDxW/KPQ7IDN4tsikQfByIAfm+\nrV4/P4qDeQKBgQCiTTN3uXoXzSFEbAcuUqD4Gi7DGk5ZDT7SLIadmq7mrK0Dxi/9\nnrwLoULE6qMRw2IUUQv3+Q8+45x/OmV7rJVjmqi34qBZXHq6SQg2gDgFaZAt+fxh\ndV0v9PDZOrjoFSd1nvlLccD6ubw8yzpYK4DepT2syD1tuguAKUaaUg5LRwKBgAsP\noWY6mLvkJ2DJ8Ka6B+56fbr0TzjVv11+DsdNjoTcOGBLzM846fOT+aBLkEA3zvHo\n2gKyEzxyC5nrtXcwtdwkgrJyE//AS/evckV52ukxYR20o+1AYTiXs+uxdGaaacvC\nMOa5lOn9EZmz0Q9ytmVILe8vhQcmFzm8b8ycpFUBAoGAePgtoBxKxSe+of2eWYZj\nz3XT1XjQZES/5uiAXp1Q7pDtAqRMtA30rtVKZjF2He8hmGCvGWM/35CKsaIS7nQt\nI1/szxSDoAxoYsAUcdJ/MaEvT8P6RZmubEs1aiyc6PprvBwr/6lM9/JNNYjZz3rU\n8yJLRj+A93whXzjNzCfnAwo=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@trial-17319.iam.gserviceaccount.com",
  "client_id": "105218357354604939181",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40trial-17319.iam.gserviceaccount.com","universe_domain": "googleapis.com"
};


    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'trial-17319'
    });
    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
}

// Rest of your server code remains the same...

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
