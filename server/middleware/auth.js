import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication token is required.",
        });
    }

    const token = authHeader.slice(7);

    try {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error("JWT_SECRET is missing.");

            return res.status(500).json({
                success: false,
                message: "Authentication configuration error.",
            });
        }

        const decoded = jwt.verify(token, secret);

        if (
            !decoded ||
            typeof decoded.sub !== "string" ||
            !["admin", "member"].includes(decoded.role)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token.",
            });
        }

        req.user = {
            id: decoded.sub,
            role: decoded.role,
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token.",
        });
    }
}

// Admin-only access
export function requireAdmin(req, res, next) {
    if (req.user?.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Administrator access is required.",
        });
    }

    return next();
}

// Resident-only access
export function requireMember(req, res, next) {
    if (req.user?.role !== "member") {
        return res.status(403).json({
            success: false,
            message: "Resident access is required.",
        });
    }

    return next();
}

// Block residents until they change their default password
export async function requirePasswordChanged(req, res, next) {
    try {
        // Admins do not need to pass the resident password-change check.
        if (req.user?.role === "admin") {
            return next();
        }

        if (req.user?.role !== "member") {
            return res.status(403).json({
                success: false,
                message: "Access denied.",
            });
        }

        const result = await pool.query(
            `SELECT must_change_password, status
             FROM residents
             WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Resident account not found.",
            });
        }

        const resident = result.rows[0];

        if (resident.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your resident account is inactive.",
            });
        }

        if (resident.must_change_password) {
            return res.status(403).json({
                success: false,
                code: "PASSWORD_CHANGE_REQUIRED",
                message: "Please change your default password before accessing the dashboard.",
                mustChangePassword: true,
            });
        }

        return next();
    } catch (error) {
        console.error(
            "Password-change verification error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to verify password-change status.",
        });
    }
}