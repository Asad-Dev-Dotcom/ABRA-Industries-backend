import express from "express";
import { searchProducts, getOurProducts, getNewArrivals, getProductsByCategory } from "../controllers/home.controller.js";

const router = express.Router();

router.get("/search", searchProducts);
router.get("/our-products", getOurProducts);
router.get("/new-arrivals", getNewArrivals);
router.get("/category/:categoryName", getProductsByCategory);

export default router;