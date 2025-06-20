import express, { Request, Response } from "express"
import { verifyImage } from "../services/gemini"
import { supabase } from "../services/supabase"

const router = express.Router()

// POST /api/disasters/:id/verify-image
router.post("/api/disasters/:id/verify-image", async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { image_url } = req.body
    if (!image_url) return res.status(400).json({ error: "Missing image_url" })

    const verification = await verifyImage(image_url)
    let verification_status = "pending"
    if (verification.isAuthentic && verification.confidence > 70) verification_status = "verified"
    else if (verification.confidence < 30) verification_status = "suspicious"

    await supabase.from("disasters").update({ verification_status }).eq("id", id)
    res.json({ verification_status, verification })
  } catch (error) {
    console.error("Image verification error:", error)
    res.status(500).json({ error: "Failed to verify image" })
  }
})

export default router