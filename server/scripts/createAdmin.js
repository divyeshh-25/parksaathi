import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcrypt";
import { pool } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, "../../.env.local"),
});

async function createAdmin() {
    try {
        const name = process.env.ADMIN_NAME;
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD;

        if (!name || !email || !password) {
            throw new Error(
                "Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env.local"
            );
        }

        if (password.length < 12) {
            throw new Error("Admin password must be at least 12 characters.");
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO admins (name, email, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (email)
             DO NOTHING
             RETURNING id, name, email, status`,
            [name.trim(), email, passwordHash]
        );

        if (result.rows.length === 0) {
            console.log("An admin with this email already exists.");
            console.log("No existing account or password was changed.");
            return;
        }

        console.log("Admin account created successfully:");
        console.log(result.rows[0]);
    } finally {
        await pool.end();
    }
}

createAdmin().catch((error) => {
    console.error("Failed to create admin:", error.message);
    process.exitCode = 1;
});