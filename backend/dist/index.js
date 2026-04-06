import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import propertyRoutes from './routes/property.js';
import leadRoutes from './routes/lead.js';
import contactRoutes from './routes/contact.js';
import listingRequestRoutes from './routes/listingRequest.js';
import authRoutes from './routes/auth.js';
import adminOpsRoutes from './routes/adminOps.js';
import communicationRoutes from './routes/communication.js';
import { adminWriteLimiter, apiLimiter, authLimiter, publicFormLimiter } from './middleware/security.js';
import { ensureSecurityTables } from './services/securityStore.js';
import { ensureCommunicationTables, expireStaleRingingCalls, pruneStaleTypingStates, } from './services/communicationStore.js';
import { emitRealtimeEvent } from './services/communicationRealtime.js';
dotenv.config();
const app = express();
const port = process.env.PORT || 8081; // Triggering process reload for Cloudinary.
const configuredOrigins = process.env.CORS_ORIGIN || process.env.FRONTEND_URL;
const allowedOrigins = (configuredOrigins || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('CORS origin not allowed'));
    },
    credentials: true
}));
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api', apiLimiter);
// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminWriteLimiter, adminOpsRoutes);
app.use('/api/communications', adminWriteLimiter, communicationRoutes);
app.use('/api/properties', adminWriteLimiter, propertyRoutes);
app.use('/api/leads', publicFormLimiter, adminWriteLimiter, leadRoutes);
app.use('/api/contacts', publicFormLimiter, adminWriteLimiter, contactRoutes);
app.use('/api/listing-requests', publicFormLimiter, adminWriteLimiter, listingRequestRoutes);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Real Estate API is running' });
});
// Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.message);
    if (err instanceof SyntaxError && 'body' in err) {
        console.error('Invalid JSON body received');
        return res.status(400).json({ message: 'Malformed JSON payload' });
    }
    res.status(500).json({ message: 'Internal server error' });
});
async function startServer() {
    try {
        await ensureSecurityTables();
        await ensureCommunicationTables();
        setInterval(async () => {
            try {
                await pruneStaleTypingStates();
                const expiredCalls = await expireStaleRingingCalls(2);
                expiredCalls.forEach((call) => {
                    emitRealtimeEvent('call.updated', {
                        conversationId: call.conversation_id,
                        call,
                    });
                });
            }
            catch (error) {
                console.error('Communication maintenance job failed:', error);
            }
        }, 30000);
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    }
    catch (error) {
        console.error('Failed to initialize server:', error);
        process.exit(1);
    }
}
startServer();
export default app;
//# sourceMappingURL=index.js.map