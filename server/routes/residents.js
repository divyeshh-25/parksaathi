import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import {
    authenticateToken,
    requireAdmin,
} from "../middleware/auth.js";

const router = Router();

// GET /api/residents - Get all residents
router.get(
    "/",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    id,
                    name,
                    mobile,
                    flat_number,
                    status,
                    must_change_password,
                    created_at,
                    updated_at
                FROM residents
                ORDER BY id DESC
            `);

            return res.json({
                success: true,
                data: result.rows,
            });
        } catch (error) {
            console.error(
                "Get residents error:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch residents.",
            });
        }
    }
);

// POST /api/residents - Create resident
router.post(
    "/",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const { name, mobile, flat_number } = req.body;

            // Validate required fields
            if (
                typeof name !== "string" ||
                !name.trim() ||
                typeof mobile !== "string" ||
                !mobile.trim() ||
                typeof flat_number !== "string" ||
                !flat_number.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Name, mobile and flat number are required.",
                });
            }

            const cleanName = name.trim();
            const cleanMobile = mobile.trim();
            const cleanFlatNumber =
                flat_number.trim().toUpperCase();

            // Validate Indian mobile number
            if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Enter a valid 10-digit Indian mobile number.",
                });
            }

            // Check whether mobile number already exists
            const existingResident = await pool.query(
                `SELECT id
                 FROM residents
                 WHERE mobile = $1`,
                [cleanMobile]
            );

            if (existingResident.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This mobile number is already registered.",
                });
            }

            // Default password: first 8 digits of mobile number
            const defaultPassword =
                cleanMobile.substring(0, 8);

            // Store the password as a bcrypt hash
            const passwordHash = await bcrypt.hash(
                defaultPassword,
                12
            );

            // Create resident with mandatory password change
            const result = await pool.query(
                `INSERT INTO residents (
                    name,
                    mobile,
                    flat_number,
                    password_hash,
                    must_change_password
                )
                VALUES ($1, $2, $3, $4, TRUE)
                RETURNING
                    id,
                    name,
                    mobile,
                    flat_number,
                    status,
                    must_change_password,
                    created_at,
                    updated_at`,
                [
                    cleanName,
                    cleanMobile,
                    cleanFlatNumber,
                    passwordHash,
                ]
            );

            return res.status(201).json({
                success: true,
                message:
                    "Resident created successfully. The default password is the first 8 digits of the mobile number.",
                data: result.rows[0],
            });
        } catch (error) {
            console.error(
                "Create resident error:",
                error
            );

            // Handle database unique constraint violations
            if (error.code === "23505") {
                return res.status(409).json({
                    success: false,
                    message:
                        "This mobile number or resident record already exists.",
                });
            }

            return res.status(500).json({
                success: false,
                message: "Failed to create resident.",
            });
        }
    }
);

// PUT /api/residents/:id - Update resident
router.put(
    "/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { name, mobile, flat_number, status } =
                req.body;

            // Validate required fields
            if (
                typeof name !== "string" ||
                !name.trim() ||
                typeof mobile !== "string" ||
                !mobile.trim() ||
                typeof flat_number !== "string" ||
                !flat_number.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Name, mobile and flat number are required.",
                });
            }

            // Validate mobile number
            const cleanMobile = mobile.trim();

            if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Enter a valid 10-digit Indian mobile number.",
                });
            }

            // Validate resident status
            if (!["active", "inactive"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid resident status.",
                });
            }

            // Check whether resident exists
            const existingResident = await pool.query(
                `SELECT id
                 FROM residents
                 WHERE id = $1`,
                [id]
            );

            if (existingResident.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Resident not found.",
                });
            }

            // Check for duplicate mobile number
            const duplicateMobile = await pool.query(
                `SELECT id
                 FROM residents
                 WHERE mobile = $1
                   AND id != $2`,
                [cleanMobile, id]
            );

            if (duplicateMobile.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This mobile number is already registered.",
                });
            }

            // Update resident details only.
            // Do not reset password during an ordinary edit.
            const result = await pool.query(
                `UPDATE residents
                 SET
                    name = $1,
                    mobile = $2,
                    flat_number = $3,
                    status = $4,
                    updated_at = NOW()
                 WHERE id = $5
                 RETURNING
                    id,
                    name,
                    mobile,
                    flat_number,
                    status,
                    must_change_password,
                    created_at,
                    updated_at`,
                [
                    name.trim(),
                    cleanMobile,
                    flat_number.trim().toUpperCase(),
                    status,
                    id,
                ]
            );

            return res.json({
                success: true,
                message:
                    "Resident updated successfully.",
                data: result.rows[0],
            });
        } catch (error) {
            console.error(
                "Update resident error:",
                error
            );

            if (error.code === "23505") {
                return res.status(409).json({
                    success: false,
                    message:
                        "This mobile number is already registered.",
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Unable to update resident.",
            });
        }
    }
);

export default router;