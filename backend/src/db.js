import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// helper: consulta con manejo de errores
export async function query(sql, params = []) {
    try {
        const { rows } = await pool.query(sql, params);
        return rows;
    } catch (err) {
        console.error("[DB ERROR]", err);
        throw err;
    }
}