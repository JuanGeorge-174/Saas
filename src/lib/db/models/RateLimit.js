import mongoose from 'mongoose';

const RateLimitSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // IP + Route or UserId + Route
    points: { type: Number, default: 0 },
    expireAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h
        expires: 0
    },
});

export default mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema);
