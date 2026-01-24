import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../models/product.model.js";
import { CustomError } from "../utils/customError.js";
import { PRODUCT_MAIN_CATEGORIES, PRODUCT_SUB_CATEGORIES } from "../constants/product.constants.js";

const searchProducts = asyncHandler(async (req, res, next) => {
    const { search } = req.query;
    if (!search) {
        return next(new CustomError(400, "Search query is required"));
    }
    const products = await Product.find({
        searchText: { $regex: search, $options: "i" },
    });
    res.status(200).json({
        success: true,
        data: products,
        message: "Products found successfully",
    });
});

const getOurProducts = asyncHandler(async (req, res, next) => {
    const category = req.query.category;
    const limit = req.query.limit || 8;
    const page = req.query.page || 1;
    const skip = (page - 1) * limit;
    const products = await Product.find({ category }).sort({ createdAt: -1 }).limit(limit).skip(skip);
    const totalProducts = await Product.countDocuments({ category });
    const totalPages = Math.ceil(totalProducts / limit);
    res.status(200).json({
        success: true,
        data: products,
        message: "Products found successfully",
        pagination: {
            currentPage: page,
            totalPages,
            totalProducts,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    });
});


const getNewArrivals = asyncHandler(async (req, res, next) => {
    const products = await Product.find({ isNewArrival: true }).sort({ createdAt: -1 }).limit(6);
    res.status(200).json({
        success: true,
        data: products,
        message: "New arrivals found successfully",
    });
});

const getProductsByCategory = asyncHandler(async (req, res, next) => {
    const { categoryName } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    if (!categoryName) {
        return next(new CustomError(400, "Category name is required"));
    }

    // Determine if it is a main category or sub category
    let query = {};

    // Check if it is a main category
    if (PRODUCT_MAIN_CATEGORIES.includes(categoryName)) {
        query["category.main"] = categoryName;
    }
    // Check if it is a sub category (flatten values to check)
    else {
        const allSubCats = Object.values(PRODUCT_SUB_CATEGORIES).flat();
        if (allSubCats.includes(categoryName)) {
            query["category.sub"] = categoryName;
        } else {
            // Fallback: search both fields with regex if exact match not found or just return empty for strictness
            // Use regex for flexibility as requested "fetch only on the basis of main..."
            query.$or = [
                { "category.main": categoryName },
                { "category.sub": categoryName }
            ];
        }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const products = await Product.find(query)
        .populate('owner', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
        success: true,
        data: products,
        category: categoryName,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalProducts,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1,
        },
    });
});

export { searchProducts, getOurProducts, getNewArrivals, getProductsByCategory };