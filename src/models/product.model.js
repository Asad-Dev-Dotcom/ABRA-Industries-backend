import mongoose from "mongoose";

// Product Schema
const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        isDiscounted: {
            type: Boolean,
            default: false,
        },
        discountedPrice: {
            type: Number,
            min: 0,
        },
        isColorAvailable: {
            type: Boolean,
            default: false,
        },
        colors: [
            {
                name: {
                    type: String,
                    required: true,
                },
                hex: {
                    type: String,
                    required: true,
                },
            }
        ],
        isSizeAvailable: {
            type: Boolean,
            default: false,
        },
        sizes: [
            {
                name: {
                    type: String,
                    required: true,
                },
                value: {
                    type: String,
                    required: true,
                },
            }
        ],
        category: {
            type: String,
            required: true,
            trim: true,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
        },
        images: [{
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        }],
        isNewArrival: {
            type: Boolean,
            default: false,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Auth",
            required: true,
        },
    },
    { timestamps: true }
);

// Index for better query performance
productSchema.index({ owner: 1, category: 1 });

export const Product = mongoose.model("Product", productSchema);
