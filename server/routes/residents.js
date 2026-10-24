import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /api/residents - Get all residents
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT id, name, mobile, flat_number, status, created_at, updated_at
      FROM residents
      ORDER BY id DESC
    `);

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error("Get residents error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch residents",
        });
    }
});

// POST /api/residents - Create resident
router.post("/", async (req, res) => {
    try {
        const { name, mobile, flat_number } = req.body;

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
                message: "Name, mobile and flat number are required",
            });
        }

        const result = await pool.query(
            `INSERT INTO residents (name, mobile, flat_number)
       VALUES ($1, $2, $3)
       RETURNING id, name, mobile, flat_number, status, created_at`,
            [name.trim(), mobile.trim(), flat_number.trim()]
        );

        res.status(201).json({
            success: true,
            message: "Resident created successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Create resident error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to create resident",
        });
    }
});

// PUT /api/residents/id - Edit resident
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, mobile, flat_number, status } = req.body;

        if (!name?.trim() || !mobile?.trim() || !flat_number?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name, mobile and flat number are required.",
            });
        }

        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resident status.",
            });
        }

        const existingResident = await pool.query(
            "SELECT id FROM residents WHERE id = $1",
            [id]
        );

        if (existingResident.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Resident not found.",
            });
        }

        const duplicateMobile = await pool.query(
            "SELECT id FROM residents WHERE mobile = $1 AND id != $2",
            [mobile.trim(), id]
        );

        if (duplicateMobile.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This mobile number is already registered.",
            });
        }

        const result = await pool.query(
            `UPDATE residents
         SET name = $1,
             mobile = $2,
             flat_number = $3,
             status = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING id, name, mobile, flat_number, status, created_at, updated_at`,
            [
                name.trim(),
                mobile.trim(),
                flat_number.trim().toUpperCase(),
                status,
                id,
            ]
        );

        return res.json({
            success: true,
            message: "Resident updated successfully.",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Update resident error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update resident.",
        });
    }
});
export default router;