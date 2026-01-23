import cookieParser from "cookie-parser";
import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import AuthRoutes from "./routes/auth.routes.js";
import ProductRoutes from "./routes/product.routes.js";
import cors from "cors";
import morgan from "morgan";
import http from "http";

export const app = express();
export const server = http.createServer(app);

// middlewares
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.get("/", (req, res) =>
  res.status(200).json({ success: true, message: "Hello World!" })
);

app.use("/api/auth", AuthRoutes);
app.use("/api/product", ProductRoutes);

// error handler
app.use(errorHandler);

console.log("hello warranty system + charity project");
