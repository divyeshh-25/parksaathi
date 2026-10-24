import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

const allowedFields = [
  "privacy_mode",
  "show_vehicle_number",
  "show_owner_name",
  "show_flat_number",
  "show_owner_mobile",
  "allow_contact_requests",
  "allow_urgent_notifications",
  "allow_qr_scanning",
];

const defaultSettings = {
  privacy_mode: true,
  show_vehicle_number: true,
  show_owner_name: false,
  show_flat_number: false,
  show_owner_mobile: false,
  allow_contact_requests: true,
  allow_urgent_notifications: true,
  allow_qr_scanning: true,
};

// GET /api/privacy-settings
// Fetch global privacy settings
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM privacy_settings WHERE id = 1"
    );

    res.json({
      success: true,
      data: result.rows[0] || defaultSettings,
    });
  } catch (error) {
    console.error("Get privacy settings error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch privacy settings",
    });
  }
});

// PUT /api/privacy-settings
// Save global privacy settings
router.put("/", async (req, res) => {
  try {
    const input = req.body;

    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return res.status(400).json({
        success: false,
        message: "A settings object is required",
      });
    }

    const keys = Object.keys(input);

    if (keys.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one setting",
      });
    }

    const invalidField = keys.find(
      (key) => !allowedFields.includes(key)
    );

    if (invalidField) {
      return res.status(400).json({
        success: false,
        message: `Invalid setting: ${invalidField}`,
      });
    }

    const invalidValue = keys.find(
      (key) => typeof input[key] !== "boolean"
    );

    if (invalidValue) {
      return res.status(400).json({
        success: false,
        message: `${invalidValue} must be a boolean`,
      });
    }

    const currentResult = await pool.query(
      "SELECT * FROM privacy_settings WHERE id = 1"
    );

    const currentSettings = {
      ...defaultSettings,
      ...(currentResult.rows[0] || {}),
    };

    const mergedSettings = {
      ...currentSettings,
      ...input,
    };

    const result = await pool.query(
      `
        INSERT INTO privacy_settings (
          id,
          privacy_mode,
          show_vehicle_number,
          show_owner_name,
          show_flat_number,
          show_owner_mobile,
          allow_contact_requests,
          allow_urgent_notifications,
          allow_qr_scanning,
          updated_at
        )
        VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          privacy_mode = EXCLUDED.privacy_mode,
          show_vehicle_number = EXCLUDED.show_vehicle_number,
          show_owner_name = EXCLUDED.show_owner_name,
          show_flat_number = EXCLUDED.show_flat_number,
          show_owner_mobile = EXCLUDED.show_owner_mobile,
          allow_contact_requests = EXCLUDED.allow_contact_requests,
          allow_urgent_notifications = EXCLUDED.allow_urgent_notifications,
          allow_qr_scanning = EXCLUDED.allow_qr_scanning,
          updated_at = NOW()
        RETURNING *
      `,
      [
        mergedSettings.privacy_mode,
        mergedSettings.show_vehicle_number,
        mergedSettings.show_owner_name,
        mergedSettings.show_flat_number,
        mergedSettings.show_owner_mobile,
        mergedSettings.allow_contact_requests,
        mergedSettings.allow_urgent_notifications,
        mergedSettings.allow_qr_scanning,
      ]
    );

    res.json({
      success: true,
      message: "Privacy settings saved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Save privacy settings error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to save privacy settings",
    });
  }
});

export default router;