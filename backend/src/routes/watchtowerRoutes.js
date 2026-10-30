import { Router } from "express";
import { getForecast } from "../controllers/watchtowerController.js";

const router = Router();

router.get("/forecast", getForecast);

export default router;