import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import watchtowerRoutes from "./routes/watchtowerRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || true,
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Watchtower backend is running",
  });
});

app.use("/api/watchtower", watchtowerRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

app.use(express.static(frontendDistPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

export default app;