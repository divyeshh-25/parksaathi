import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import residentsRouter from "./routes/residents.js";
import vehiclesRouter from "./routes/vehicles.js";
import privacySettingsRouter from "./routes/privacySettings.js";
import { pool } from "./db.js";
import authRouter from "./routes/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env.local"),
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS database_time");

    res.json({
      success: true,
      message: "ParkSaathi API is running",
      database: "connected",
      databaseTime: result.rows[0].database_time,
    });
  } catch (error) {
    console.error("Health check error:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/residents", residentsRouter);
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/privacy-settings", privacySettingsRouter);

const server = app.listen(PORT, () => {
  console.log(`ParkSaathi API running on port ${PORT}`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);