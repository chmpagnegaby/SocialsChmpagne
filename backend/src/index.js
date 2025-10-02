import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import postsRouter from "./routes/post.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use("/posts", postsRouter);

// Health check
app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
});