import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config({ path: ".env.local" });

const { pool } = await import("../db.js");

async function resetResidentPasswords() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(`
            SELECT id, name, mobile
            FROM residents
            WHERE status = 'active'
            ORDER BY id
            FOR UPDATE
        `);

        let updated = 0;
        let skipped = 0;

        for (const resident of result.rows) {
            const mobile = String(resident.mobile ?? "").trim();

            // Only process valid 10-digit Indian mobile numbers.
            if (!/^[6-9]\d{9}$/.test(mobile)) {
                console.warn(
                    `Skipping resident ID ${resident.id}: invalid mobile number.`
                );

                skipped++;
                continue;
            }

            // Temporary password = first 8 digits of mobile.
            const temporaryPassword = mobile.substring(0, 8);

            // Store only the bcrypt hash, never plaintext.
            const passwordHash = await bcrypt.hash(
                temporaryPassword,
                12
            );

            await client.query(
                `
                UPDATE residents
                SET password_hash = $1,
                    must_change_password = TRUE,
                    updated_at = NOW()
                WHERE id = $2
                `,
                [passwordHash, resident.id]
            );

            updated++;

            console.log(
                `Updated resident ID ${resident.id}: ${resident.name}`
            );
        }

        await client.query("COMMIT");

        console.log("\nResident password reset completed.");
        console.log(`Updated: ${updated}`);
        console.log(`Skipped: ${skipped}`);
        console.log(
            "All updated residents must change their password at next login."
        );
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Password reset failed:", error.message);

        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

resetResidentPasswords();