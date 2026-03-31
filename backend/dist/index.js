import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import propertyRoutes from './routes/property.js';
import leadRoutes from './routes/lead.js';
import authRoutes from './routes/auth.js';
dotenv.config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/leads', leadRoutes);
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
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
export default app;
//# sourceMappingURL=index.js.map