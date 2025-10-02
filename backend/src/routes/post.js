import { Router } from "express";
import { query } from "../db.js";

const router = Router();

/** GET /posts  -> listar todos */
router.get("/", async(req, res) => {
    try {
        const rows = await query(
            "SELECT p.id, p.titulo, p.contenido, p.usuario_id, p.created_at FROM posts p ORDER BY p.created_at DESC"
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: "Error al listar posts" });
    }
});

/** GET /posts/:id -> obtener uno */
router.get("/:id", async(req, res) => {
    try {
        const { id } = req.params;
        const rows = await query(
            "SELECT id, titulo, contenido, usuario_id, created_at FROM posts WHERE id = $1", [id]
        );
        if (rows.length === 0) return res.status(404).json({ error: "Post no encontrado" });
        res.json(rows[0]);
    } catch (e) {
        res.status(500).json({ error: "Error al obtener post" });
    }
});

/** POST /posts -> crear */
router.post("/", async(req, res) => {
    try {
        const { titulo, contenido, usuario_id } = req.body;
        if (!titulo || !contenido || !usuario_id) {
            return res.status(400).json({ error: "titulo, contenido y usuario_id son obligatorios" });
        }
        const rows = await query(
            `INSERT INTO posts (titulo, contenido, usuario_id)
       VALUES ($1, $2, $3)
       RETURNING id, titulo, contenido, usuario_id, created_at`, [titulo, contenido, usuario_id]
        );
        res.status(201).json(rows[0]);
    } catch (e) {
        res.status(500).json({ error: "Error al crear post" });
    }
});

/** PUT /posts/:id -> actualizar */
router.put("/:id", async(req, res) => {
    try {
        const { id } = req.params;
        const { titulo, contenido } = req.body;
        if (!titulo && !contenido) {
            return res.status(400).json({ error: "Nada que actualizar (titulo o contenido)" });
        }
        const fields = [];
        const params = [];
        let idx = 1;

        if (titulo) {
            fields.push(`titulo = $${idx++}`);
            params.push(titulo);
        }
        if (contenido) {
            fields.push(`contenido = $${idx++}`);
            params.push(contenido);
        }
        params.push(id);

        const rows = await query(
            `UPDATE posts SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, titulo, contenido, usuario_id, created_at`,
            params
        );
        if (rows.length === 0) return res.status(404).json({ error: "Post no encontrado" });
        res.json(rows[0]);
    } catch (e) {
        res.status(500).json({ error: "Error al actualizar post" });
    }
});

/** DELETE /posts/:id -> eliminar */
router.delete("/:id", async(req, res) => {
    try {
        const { id } = req.params;
        const rows = await query(
            "DELETE FROM posts WHERE id = $1 RETURNING id", [id]
        );
        if (rows.length === 0) return res.status(404).json({ error: "Post no encontrado" });
        res.json({ ok: true, id: rows[0].id });
    } catch (e) {
        res.status(500).json({ error: "Error al eliminar post" });
    }
});

export default router;