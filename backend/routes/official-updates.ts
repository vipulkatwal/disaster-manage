import express, { Request, Response } from "express"
import { getOfficialUpdates } from "../services/officialUpdates"

const router = express.Router()

// GET /api/disasters/:id/official-updates
router.get("/api/disasters/:id/official-updates", async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = await getOfficialUpdates(id)
    res.json(updates)
  } catch (error) {
    console.error("Official updates error:", error)
    res.status(500).json({ error: "Failed to fetch official updates" })
  }
})

export default router