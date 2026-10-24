import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";
import {
  authenticateToken,
  requireAdmin,
  requireMember,
  requirePasswordChanged,
} from "../middleware/auth.js";

const router = Router();

// Normalize QR status
const normalizeQrStatus = (value) => {
  if (value === undefined || value === null || value === "") {
    return "active";
  }

  if (typeof value !== "string") {
    return null;
  }

  const status = value.trim().toLowerCase();

  return ["active", "inactive"].includes(status) ? status : null;
};

// Validate vehicle fields
const validateVehicleFields = ({
  registration_number,
  vehicle_type,
  model,
  resident_id,
  qr_status,
}) => {
  if (
    typeof registration_number !== "string" ||
    !registration_number.trim() ||
    !/^[A-Za-z0-9 -]{4,20}$/.test(registration_number.trim()) ||
    !Number.isSafeInteger(Number(resident_id)) ||
    Number(resident_id) < 1
  ) {
    return "Valid registration number and resident ID are required";
  }

  if (
    vehicle_type != null &&
    (typeof vehicle_type !== "string" ||
      vehicle_type.trim().length > 50)
  ) {
    return "Invalid vehicle type";
  }

  if (
    model != null &&
    (typeof model !== "string" || model.trim().length > 100)
  ) {
    return "Invalid vehicle model";
  }

  if (normalizeQrStatus(qr_status) === null) {
    return "QR status must be active or inactive";
  }

  return null;
};

// GET /api/vehicles
// Get all vehicles with resident details
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        v.id,
        v.public_id,
        v.registration_number,
        v.vehicle_type,
        v.model,
        v.resident_id,
        v.qr_token,
        v.qr_status,
        v.created_at,
        v.updated_at,
        r.name AS resident_name,
        r.mobile AS resident_mobile,
        r.flat_number,
        r.status AS resident_status
      FROM vehicles v
      JOIN residents r ON r.id = v.resident_id
      ORDER BY v.id DESC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get vehicles error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
    });
  }
});

// GET /api/vehicles/mine
// Return only the authenticated member's vehicles.
router.get(
  "/mine",
  authenticateToken,
  requireMember,
  requirePasswordChanged,
  async (req, res) => {
    try {
      const residentId = Number(req.user.id);

      if (!Number.isSafeInteger(residentId) || residentId < 1) {
        return res.status(401).json({
          success: false,
          message: "Invalid authentication session. Please log in again.",
        });
      }

      const result = await pool.query(
        `
          SELECT
            v.id,
            v.public_id,
            v.registration_number,
            v.vehicle_type,
            v.model,
            v.resident_id,
            v.qr_token,
            v.qr_status,
            v.created_at,
            v.updated_at
          FROM vehicles v
          INNER JOIN residents r
            ON r.id = v.resident_id
          WHERE v.resident_id = $1
            AND r.status = 'active'
          ORDER BY v.id DESC
        `,
        [residentId]
      );

      return res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error("Get member vehicles error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch your vehicles.",
      });
    }
  }
);

// GET /api/vehicles/:id
// Get a single vehicle
router.get("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID",
      });
    }

    const result = await pool.query(
      `
        SELECT
          v.id,
          v.public_id,
          v.registration_number,
          v.vehicle_type,
          v.model,
          v.resident_id,
          v.qr_token,
          v.qr_status,
          v.created_at,
          v.updated_at,
          r.name AS resident_name,
          r.mobile AS resident_mobile,
          r.flat_number,
          r.status AS resident_status
        FROM vehicles v
        JOIN residents r ON r.id = v.resident_id
        WHERE v.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get vehicle error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle",
    });
  }
});

// POST /api/vehicles
// Create vehicle and generate permanent UUIDs
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      registration_number,
      vehicle_type,
      model,
      resident_id,
      qr_status,
    } = req.body;

    const validationError = validateVehicleFields({
      registration_number,
      vehicle_type,
      model,
      resident_id,
      qr_status,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const registration = registration_number
      .trim()
      .toUpperCase();

    const normalizedQrStatus = normalizeQrStatus(qr_status);

    // Verify resident exists
    const resident = await pool.query(
      "SELECT id, status FROM residents WHERE id = $1",
      [Number(resident_id)]
    );

    if (resident.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Resident not found",
      });
    }

    // Do not assign vehicles to inactive residents
    if (resident.rows[0].status !== "active") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot assign a vehicle to an inactive resident",
      });
    }

    const publicId = randomUUID();
    const qrToken = randomUUID();

    const result = await pool.query(
      `
        INSERT INTO vehicles (
          public_id,
          registration_number,
          vehicle_type,
          model,
          resident_id,
          qr_token,
          qr_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          public_id,
          registration_number,
          vehicle_type,
          model,
          resident_id,
          qr_token,
          qr_status,
          created_at,
          updated_at
      `,
      [
        publicId,
        registration,
        vehicle_type?.trim() || null,
        model?.trim() || null,
        Number(resident_id),
        qrToken,
        normalizedQrStatus,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Registration number already exists",
      });
    }

    console.error("Create vehicle error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create vehicle",
    });
  }
});

// PUT /api/vehicles/:id
// Update vehicle without changing its permanent QR identity
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      registration_number,
      vehicle_type,
      model,
      resident_id,
      qr_status,
    } = req.body;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID",
      });
    }

    const validationError = validateVehicleFields({
      registration_number,
      vehicle_type,
      model,
      resident_id,
      qr_status,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // Verify resident exists and is active
    const resident = await pool.query(
      "SELECT id, status FROM residents WHERE id = $1",
      [Number(resident_id)]
    );

    if (resident.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Resident not found",
      });
    }

    if (resident.rows[0].status !== "active") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot assign a vehicle to an inactive resident",
      });
    }

    const result = await pool.query(
      `
        UPDATE vehicles
        SET
          registration_number = $1,
          vehicle_type = $2,
          model = $3,
          resident_id = $4,
          qr_status = $5,
          updated_at = NOW()
        WHERE id = $6
        RETURNING
          id,
          public_id,
          registration_number,
          vehicle_type,
          model,
          resident_id,
          qr_token,
          qr_status,
          created_at,
          updated_at
      `,
      [
        registration_number.trim().toUpperCase(),
        vehicle_type?.trim() || null,
        model?.trim() || null,
        Number(resident_id),
        normalizeQrStatus(qr_status),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.json({
      success: true,
      message: "Vehicle updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Registration number already exists",
      });
    }

    console.error("Update vehicle error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update vehicle",
    });
  }
});

// DELETE /api/vehicles/:id
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID",
      });
    }

    const result = await pool.query(
      "DELETE FROM vehicles WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Delete vehicle error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete vehicle",
    });
  }
});

// GET /api/vehicles/scan/:token
// Validate QR token and return permitted vehicle information.
router.get("/scan/:token", async (req, res) => {
  try {
      const { token } = req.params;

      if (!token || token.length > 100) {
          return res.status(400).json({
              success: false,
              message: "Invalid QR token",
          });
      }

      const vehicleResult = await pool.query(
          `
          SELECT
              v.id,
              v.public_id,
              v.registration_number,
              v.vehicle_type,
              v.model,
              v.qr_token,
              v.qr_status,
              r.name AS resident_name,
              r.mobile AS resident_mobile,
              r.flat_number,
              r.status AS resident_status
          FROM vehicles v
          JOIN residents r ON r.id = v.resident_id
          WHERE v.qr_token = $1
          LIMIT 1
          `,
          [token]
      );

      if (vehicleResult.rows.length === 0) {
          return res.status(404).json({
              success: false,
              message: "QR code is invalid or vehicle was not found",
          });
      }

      const vehicle = vehicleResult.rows[0];

      if (vehicle.qr_status !== "active") {
          return res.status(403).json({
              success: false,
              message: "This vehicle QR code is inactive",
          });
      }

      if (vehicle.resident_status !== "active") {
          return res.status(403).json({
              success: false,
              message: "This vehicle is assigned to an inactive resident",
          });
      }

      const settingsResult = await pool.query(
          "SELECT * FROM privacy_settings WHERE id = 1"
      );

      const settings = {
          privacy_mode: true,
          show_vehicle_number: true,
          show_owner_name: false,
          show_flat_number: false,
          show_owner_mobile: false,
          allow_contact_requests: true,
          allow_urgent_notifications: true,
          allow_qr_scanning: true,
          ...(settingsResult.rows[0] || {}),
      };

      if (!settings.allow_qr_scanning) {
          return res.status(403).json({
              success: false,
              message: "QR scanning is disabled in privacy settings",
          });
      }

      // Never expose the QR token or resident details in the response.
      // Return only fields allowed by the privacy settings.
      const publicVehicle = {
          registration_number: settings.show_vehicle_number
              ? vehicle.registration_number
              : null,
          vehicle_type: vehicle.vehicle_type,
          model: vehicle.model,
          resident_name: settings.show_owner_name
              ? vehicle.resident_name
              : null,
          flat_number: settings.show_flat_number
              ? vehicle.flat_number
              : null,
          resident_mobile: settings.show_owner_mobile
              ? vehicle.resident_mobile
              : null,
      };

      res.json({
          success: true,
          data: {
              vehicle: publicVehicle,
              privacySettings: {
                  privacy_mode: settings.privacy_mode,
                  show_vehicle_number: settings.show_vehicle_number,
                  show_owner_name: settings.show_owner_name,
                  show_flat_number: settings.show_flat_number,
                  show_owner_mobile: settings.show_owner_mobile,
                  allow_contact_requests: settings.allow_contact_requests,
                  allow_urgent_notifications:
                      settings.allow_urgent_notifications,
                  allow_qr_scanning: settings.allow_qr_scanning,
              },
          },
      });
  } catch (error) {
      console.error("Scan QR error:", error.message);

      res.status(500).json({
          success: false,
          message: "Failed to validate vehicle QR code",
      });
  }
});


// POST /api/vehicles/scan/:token/verify
// Verify an active resident's registered mobile number.
router.post("/scan/:token/verify", async (req, res) => {
  try {
      const { token } = req.params;
      const { mobile } = req.body;

      if (!token || token.length > 100) {
          return res.status(400).json({
              success: false,
              message: "Invalid QR token",
          });
      }

      if (
          typeof mobile !== "string" ||
          !/^[6-9]\d{9}$/.test(mobile)
      ) {
          return res.status(400).json({
              success: false,
              message: "Enter a valid 10-digit Indian mobile number",
          });
      }

      const vehicleResult = await pool.query(
          `
          SELECT
              v.id,
              v.registration_number,
              v.vehicle_type,
              v.model,
              v.qr_status,
              r.name AS resident_name,
              r.mobile AS resident_mobile,
              r.flat_number,
              r.status AS resident_status
          FROM vehicles v
          JOIN residents r ON r.id = v.resident_id
          WHERE v.qr_token = $1
          LIMIT 1
          `,
          [token]
      );

      if (vehicleResult.rows.length === 0) {
          return res.status(404).json({
              success: false,
              message: "QR code is invalid or vehicle was not found",
          });
      }

      const vehicle = vehicleResult.rows[0];

      if (
          vehicle.qr_status !== "active" ||
          vehicle.resident_status !== "active"
      ) {
          return res.status(403).json({
              success: false,
              message: "This vehicle QR code is inactive",
          });
      }

      const settingsResult = await pool.query(
          "SELECT * FROM privacy_settings WHERE id = 1"
      );

      const settings = {
          privacy_mode: true,
          show_vehicle_number: true,
          show_owner_name: false,
          show_flat_number: false,
          show_owner_mobile: false,
          allow_contact_requests: true,
          allow_urgent_notifications: true,
          allow_qr_scanning: true,
          ...(settingsResult.rows[0] || {}),
      };

      if (!settings.allow_qr_scanning) {
          return res.status(403).json({
              success: false,
              message: "QR scanning is disabled in privacy settings",
          });
      }

      // Match the submitted mobile against active residents in the database.
      const memberResult = await pool.query(
          `
          SELECT id
          FROM residents
          WHERE mobile = $1
            AND status = 'active'
          LIMIT 1
          `,
          [mobile]
      );

      if (memberResult.rows.length === 0) {
          return res.status(403).json({
              success: false,
              message:
                  "This mobile number is not registered as an active society member",
          });
      }

      const publicVehicle = {
          registration_number: settings.show_vehicle_number
              ? vehicle.registration_number
              : null,
          vehicle_type: vehicle.vehicle_type,
          model: vehicle.model,
          resident_name: settings.show_owner_name
              ? vehicle.resident_name
              : null,
          flat_number: settings.show_flat_number
              ? vehicle.flat_number
              : null,
          resident_mobile: settings.show_owner_mobile
              ? vehicle.resident_mobile
              : null,
      };

      res.json({
          success: true,
          message: "Society membership verified successfully",
          data: {
              vehicle: publicVehicle,
              privacySettings: {
                  privacy_mode: settings.privacy_mode,
                  show_vehicle_number: settings.show_vehicle_number,
                  show_owner_name: settings.show_owner_name,
                  show_flat_number: settings.show_flat_number,
                  show_owner_mobile: settings.show_owner_mobile,
                  allow_contact_requests: settings.allow_contact_requests,
                  allow_urgent_notifications:
                      settings.allow_urgent_notifications,
                  allow_qr_scanning: settings.allow_qr_scanning,
              },
          },
      });
  } catch (error) {
      console.error("Verify QR membership error:", error.message);

      res.status(500).json({
          success: false,
          message: "Failed to verify society membership",
      });
  }
});

export default router;