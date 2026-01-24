import mongoose from "mongoose";
import { PRODUCT_SIZES, PRODUCT_MAIN_CATEGORIES, PRODUCT_SUB_CATEGORIES } from "../constants/product.constants.js"

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
        sizes: [
            {
                name: {
                    type: String,
                    enum: PRODUCT_SIZES.map(s => s.name),
                    required: true
                },
                value: {
                    type: String,
                    enum: PRODUCT_SIZES.map(s => s.value),
                    required: true
                }
            }
        ],
        category: {
            main: {
                type: String,
                enum: PRODUCT_MAIN_CATEGORIES,
                required: true
            },
            sub: {
                type: String,
                // The original code had `enum: PRODUCT_SUB_CATEGORIES`.
                // The comments in the provided snippet indicate that `PRODUCT_SUB_CATEGORIES` is likely an object
                // (e.g., { TOPS: [...], BOTTOMS: [...] }) rather than a flat array of all sub-categories.
                // Mongoose `enum` expects an array of strings.
                // To make the `enum` work for all possible sub-categories, we flatten the object values.
                enum: Object.values(PRODUCT_SUB_CATEGORIES).flat(),
                required: true
            }
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
        searchText: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

productSchema.path("category.sub").validate(function (value) {
    return PRODUCT_SUB_CATEGORIES[this.category.main]?.includes(value);
}, "Invalid sub-category for selected main category");


productSchema.pre("save", function (next) {
    this.searchText = this.name + " " + this.description + " " + this.category;
    next();
});

// Index for better query performance
productSchema.index({ owner: 1, category: 1, searchText: 1 });

export const Product = mongoose.model("Product", productSchema);
