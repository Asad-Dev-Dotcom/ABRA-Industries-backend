import { isValidObjectId } from "mongoose";
import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CustomError } from "../utils/customError.js";
import {
    removeFromCloudinary,
    removeMultipleFromCloudinary,
    uploadMultipleOnCloudinary,
} from "../utils/cloudinary.js";

const createProduct = asyncHandler(async (req, res, next) => {
    const ownerId = req?.user?._id;
    if (!ownerId) {
        return next(new CustomError(401, "Unauthorized"));
    }

    const { name, description, price, category, stock, isDiscounted, discountedPrice, colors, sizes, isNewArrival } = req.body;
    const files = req.files;

    if (!name || !description || !price || !category || !stock) {
        return next(new CustomError(400, "Please provide all required fields"));
    }

    if (!files || files.length === 0) {
        return next(new CustomError(400, "Please provide at least one product image"));
    }

    // Upload images to Cloudinary
    const uploadedImages = await uploadMultipleOnCloudinary(files, "products");

    if (!uploadedImages || uploadedImages.length === 0) {
        return next(new CustomError(500, "Failed to upload images"));
    }

    // Prepare image data for database
    const images = uploadedImages.map(img => ({
        public_id: img.public_id,
        url: img.secure_url,
    }));

    // Parse JSON fields
    let parsedCategory, parsedColors, parsedSizes;
    try {
        parsedCategory = JSON.parse(category);
        parsedColors = colors ? JSON.parse(colors) : [];
        parsedSizes = sizes ? JSON.parse(sizes) : [];
    } catch (error) {
        return next(new CustomError(400, "Invalid JSON format for category, colors, or sizes"));
    }

    const productData = {
        name,
        description,
        price: parseFloat(price),
        category: parsedCategory,
        stock: parseInt(stock),
        images,
        isDiscounted: isDiscounted === 'true' || isDiscounted === true,
        discountedPrice: parseFloat(discountedPrice) || 0,
        colors: parsedColors,
        sizes: parsedSizes,
        isNewArrival: isNewArrival === 'true' || isNewArrival === true,
        owner: ownerId,
        // searchText is handled by pre-save hook in model
    };

    const newProduct = await Product.create(productData);

    res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: newProduct,
    });
});

const getAllProducts = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 12, category, minPrice, maxPrice, sizes, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query object
    const query = {};

    // Category filter - handle both main and sub
    if (category) {
        query.$or = [
            { "category.main": { $regex: category, $options: 'i' } },
            { "category.sub": { $regex: category, $options: 'i' } }
        ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Sizes filter (assumes sizes is a value like "S", "M")
    if (sizes) {
        // sizes in DB is an object array [{name: "Small", value: "S"}], we search by value
        const sizeList = Array.isArray(sizes) ? sizes : sizes.split(',');
        query["sizes.value"] = { $in: sizeList };
    }

    // Search filter (name, description, category)
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { "category.main": { $regex: search, $options: 'i' } },
            { "category.sub": { $regex: search, $options: 'i' } },
            { searchText: { $regex: search, $options: 'i' } }
        ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with filters, sorting and pagination
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
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalProducts,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1,
        },
    });
});

const getOneProduct = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;
    if (!isValidObjectId(productId)) {
        return next(new CustomError(400, "Invalid product ID"));
    }
    const product = await Product.findById(productId).populate('owner', 'name email');
    if (!product) {
        return next(new CustomError(404, "Product not found"));
    }
    res.status(200).json({
        success: true,
        data: product,
    });
});

const getProductsByCategory = asyncHandler(async (req, res, next) => {
    // We import constants here as they are needed
    const { PRODUCT_MAIN_CATEGORIES, PRODUCT_SUB_CATEGORIES } = await import("../constants/product.constants.js");

    const { categoryName } = req.params;
    const { page = 1, limit = 20, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

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

    // Price range filter
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
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

const updateProduct = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;
    const ownerId = req?.user?._id;
    if (!isValidObjectId(productId)) {
        return next(new CustomError(400, "Invalid product ID"));
    }
    if (!ownerId) {
        return next(new CustomError(401, "Unauthorized"));
    }

    const product = await Product.findById(productId);
    if (!product) {
        return next(new CustomError(404, "Product not found"));
    }
    if (product.owner.toString() !== ownerId.toString()) {
        return next(new CustomError(403, "Forbidden: You do not own this product"));
    }

    const { name, description, price, category, stock, isDiscounted, discountedPrice, colors, sizes, isNewArrival, existingImages } = req.body;
    const files = req.files;

    // Update fields
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = parseFloat(price);

    if (category !== undefined) {
        try {
            product.category = JSON.parse(category);
        } catch (e) {
            return next(new CustomError(400, "Invalid JSON for category"));
        }
    }

    if (stock !== undefined) product.stock = parseInt(stock);
    if (isDiscounted !== undefined) product.isDiscounted = isDiscounted === 'true' || isDiscounted === true;
    if (discountedPrice !== undefined) product.discountedPrice = parseFloat(discountedPrice);

    if (colors !== undefined) {
        try {
            product.colors = JSON.parse(colors);
        } catch (e) {
            return next(new CustomError(400, "Invalid JSON for colors"));
        }
    }

    if (sizes !== undefined) {
        try {
            product.sizes = JSON.parse(sizes);
        } catch (e) {
            return next(new CustomError(400, "Invalid JSON for sizes"));
        }
    }

    if (isNewArrival !== undefined) product.isNewArrival = isNewArrival === 'true' || isNewArrival === true;

    // Handle image updates
    let finalImages = [];

    // Existing images
    if (existingImages) {
        try {
            finalImages = JSON.parse(existingImages);
        } catch (error) {
            // If parsing fails, maybe it's just not sent or sent incorrectly, but we should be careful.
            // If user meant to keep images but parsing failed, we might wipe them.
            // But usually existingImages comes as stringified JSON from frontend.
        }
    }

    // Add new uploaded images
    if (files && files.length > 0) {
        const uploadedImages = await uploadMultipleOnCloudinary(files, "products");
        if (!uploadedImages || uploadedImages.length === 0) {
            return next(new CustomError(500, "Failed to upload new images"));
        }
        const newImages = uploadedImages.map(img => ({
            public_id: img.public_id,
            url: img.secure_url,
        }));
        finalImages = [...finalImages, ...newImages];
    }

    // Only update images if we have a final list (if existingImages was empty and no new files, we might be deleting all, or frontend logic dictates)
    // However, if `existingImages` was not passed at all (undefined), we shouldn't wipe images unless that's the intent.
    // If existingImages IS passed (even empty array), it means we want that state.
    if (existingImages !== undefined || (files && files.length > 0)) {
        product.images = finalImages;
    }

    await product.save(); // This will trigger pre-save hook to update searchText

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: product,
    });
});


const deleteProduct = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;
    const ownerId = req?.user?._id;
    if (!isValidObjectId(productId)) {
        return next(new CustomError(400, "Invalid product ID"));
    }
    if (!ownerId) {
        return next(new CustomError(401, "Unauthorized"));
    }
    const product = await Product.findById(productId);
    if (!product) {
        return next(new CustomError(404, "Product not found"));
    }
    if (product.owner.toString() !== ownerId.toString()) {
        return next(new CustomError(403, "Forbidden: You do not own this product"));
    }

    // Delete images from Cloudinary before deleting product
    if (product.images && product.images.length > 0) {
        const publicIds = product.images.map(img => img.public_id);
        await removeMultipleFromCloudinary(publicIds, "image");
    }

    await Product.findByIdAndDelete(productId);
    res.status(200).json({
        success: true,
        message: "Product deleted successfully",
    });
});

const getMyProducts = asyncHandler(async (req, res, next) => {
    const ownerId = req?.user?._id;
    if (!ownerId) {
        return next(new CustomError(401, "Unauthorized"));
    }

    const products = await Product.find({ owner: ownerId }).populate('owner', 'name email');
    res.status(200).json({
        success: true,
        data: products,
    });
});

const getRelatedProducts = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;
    const limit = parseInt(req.query.limit) || 6;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const product = await Product.findById(productId);
    if (!product) {
        return next(new CustomError(404, "Product not found"));
    }
    const relatedProducts = await Product.find({ category: product.category }).sort({ createdAt: -1 }).limit(limit).skip(skip);
    const totalProducts = await Product.countDocuments({ category: product.category });
    const totalPages = Math.ceil(totalProducts / limit);
    res.status(200).json({
        success: true,
        data: relatedProducts,
        message: "Related products found successfully",
        pagination: {
            currentPage: page,
            totalPages,
            totalProducts,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    });
});

export {
    createProduct,
    getAllProducts,
    getOneProduct,
    getMyProducts,
    getProductsByCategory,
    updateProduct,
    deleteProduct,
    getRelatedProducts,
};
