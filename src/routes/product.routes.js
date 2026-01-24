import express from "express";
import {
    createProduct,
    getAllProducts,
    getOneProduct,
    getMyProducts,
    getProductsByCategory,
    updateProduct,
    deleteProduct,
    getRelatedProducts,
} from "../controllers/product.controller.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import { multipleUpload } from "../middlewares/multer.js";

const router = express.Router();

router.post("/create", isAuthenticated, multipleUpload, createProduct);
router.get("/", getAllProducts);
router.get("/:id", getOneProduct);
router.get("/my-products", isAuthenticated, getMyProducts);
router.get("/category/:categoryName", getProductsByCategory);
router.get("/related/:id", getRelatedProducts);
router.put("/:id", isAuthenticated, multipleUpload, updateProduct);
router.delete("/:id", isAuthenticated, deleteProduct);

export default router;