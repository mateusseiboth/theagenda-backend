import { Router } from "express";
import appointmentsV1Routes from "./appointments/v1/appointments";
import authV1Routes from "./auth/v1/auth";
import configV1Routes from "./config/v1/config";
import reportsV1Routes from "./reports/v1/reports";
import specialtiesV1Routes from "./specialties/v1/specialties";

const router = Router();

// Montar rotas versionadas
router.use("/api/v1/auth", authV1Routes);
router.use("/api/v1/specialties", specialtiesV1Routes);
router.use("/api/v1/appointments", appointmentsV1Routes);
router.use("/api/v1/config", configV1Routes);
router.use("/api/v1/reports", reportsV1Routes);

// Health check
router.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
