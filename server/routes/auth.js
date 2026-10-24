import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import {
    authenticateToken,
    requireMember,
} from "../middleware/auth.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env.local");
}

const TOKEN_EXPIRY = "8h";

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { role, identifier, password } = req.body;

        if (
            !["admin", "member"].includes(role) ||
            typeof identifier !== "string" ||
            !identifier.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Role, identifier and password are required.",
            });
        }

        let account;

        if (role === "admin") {
            const result = await pool.query(
                `SELECT id, name, email, password_hash, status
                 FROM admins
                 WHERE LOWER(email) = LOWER($1)
                 LIMIT 1`,
                [identifier.trim()]
            );

            account = result.rows[0];
        } else {
            const result = await pool.query(
                `SELECT id, name, mobile, flat_number, password_hash,
                        must_change_password, status
                 FROM residents
                 WHERE mobile = $1
                 LIMIT 1`,
                [identifier.trim()]
            );

            account = result.rows[0];
        }

        // Use the same message for missing accounts and incorrect passwords.
        if (
            !account ||
            account.status !== "active" ||
            !account.password_hash
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials or account is inactive.",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            account.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials or account is inactive.",
            });
        }

        const sessionUser = role === "admin"
            ? {
                id: account.id,
                role: "admin",
                name: account.name,
                email: account.email,
            }
            : {
                id: account.id,
                role: "member",
                name: account.name,
                mobile: account.mobile,
                flat: account.flat_number,
            };

        const token = jwt.sign(
            {
                sub: String(account.id),
                role,
            },
            JWT_SECRET,
            {
                expiresIn: TOKEN_EXPIRY,
            }
        );

        return res.json({
            success: true,
            message: "Login successful.",
            token,
            user: sessionUser,
            mustChangePassword:
                role === "member" && account.must_change_password,
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to log in right now.",
        });
    }
});

// POST /api/auth/change-password
router.post(
    "/change-password",
    authenticateToken,
    requireMember,
    async (req, res) => {
        try {
            const { currentPassword, newPassword, confirmPassword } =
                req.body;

            if (
                typeof currentPassword !== "string" ||
                typeof newPassword !== "string" ||
                typeof confirmPassword !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "All password fields are required.",
                });
            }

            if (
                !currentPassword ||
                !newPassword ||
                !confirmPassword
            ) {
                return res.status(400).json({
                    success: false,
                    message: "All password fields are required.",
                });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message:
                        "New password must be at least 8 characters long.",
                });
            }

            if (newPassword.length > 72) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Password cannot exceed 72 characters.",
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message:
                        "New password and confirm password do not match.",
                });
            }

            if (currentPassword === newPassword) {
                return res.status(400).json({
                    success: false,
                    message:
                        "New password must be different from the current password.",
                });
            }

            // Get the logged-in resident using the JWT subject.
            const residentResult = await pool.query(
                `SELECT id, password_hash, must_change_password
                 FROM residents
                 WHERE id = $1
                   AND status = 'active'`,
                [req.user.id]
            );

            if (residentResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Resident account not found or inactive.",
                });
            }

            const resident = residentResult.rows[0];

            if (!resident.password_hash) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Password has not been configured for this account.",
                });
            }

            // Verify the current password.
            const passwordMatches = await bcrypt.compare(
                currentPassword,
                resident.password_hash
            );

            if (!passwordMatches) {
                return res.status(400).json({
                    success: false,
                    message: "Current password is incorrect.",
                });
            }

            // Hash the new password.
            const newPasswordHash = await bcrypt.hash(
                newPassword,
                12
            );

            // Save the new hash and clear the forced-change flag.
            const updateResult = await pool.query(
                `UPDATE residents
                 SET password_hash = $1,
                     must_change_password = FALSE,
                     updated_at = NOW()
                 WHERE id = $2
                   AND status = 'active'
                 RETURNING id`,
                [newPasswordHash, req.user.id]
            );

            if (updateResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Resident account not found or inactive.",
                });
            }

            return res.json({
                success: true,
                message:
                    "Password changed successfully. You can now access your dashboard.",
                mustChangePassword: false,
            });
        } catch (error) {
            console.error(
                "Change password error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to change password.",
            });
        }
    }
);

export default router;