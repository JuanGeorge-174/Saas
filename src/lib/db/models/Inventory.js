import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema({
    clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true,
        index: true
    },
    itemName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['CONSUMABLE', 'EQUIPMENT', 'MEDICINE', 'PERSONAL_PROTECTION', 'OTHER'],
        default: 'CONSUMABLE',
        index: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    unit: {
        type: String,
        default: 'pcs' // pcs, boxes, ml, etc.
    },
    lowStockThreshold: {
        type: Number,
        default: 10
    },
    lastRestocked: { type: Date, default: Date.now },
    supplier: {
        name: String,
        contact: String
    },
    notes: String
}, {
    timestamps: true
});

InventorySchema.index({ clinicId: 1, itemName: 1 });

export default mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);
