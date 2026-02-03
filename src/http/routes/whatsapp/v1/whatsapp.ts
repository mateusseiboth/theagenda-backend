import express from "express";
import { WhatsAppController } from "../../../../controller/WhatsAppController";
import { adminMiddleware, authMiddleware as checkAuth } from "../../../../middlewares/auth";

const router = express.Router();
const controller = new WhatsAppController();

// Todas as rotas de WhatsApp precisam de autenticação de admin
router.use(checkAuth);
router.use(adminMiddleware);

// Verificar status da conexão
router.get("/status", (req, res) => controller.getStatus(req, res));

// Inicializar WhatsApp (gera QR code)
router.post("/initialize", (req, res) => controller.initialize(req, res));

// Desconectar WhatsApp
router.post("/disconnect", (req, res) => controller.disconnect(req, res));

// Enviar mensagem de teste
router.post("/send-test", (req, res) => controller.sendTestMessage(req, res));

// Enviar lembretes manualmente
router.post("/send-reminders", (req, res) => controller.sendReminders(req, res));

// Rotas de logs
router.get("/logs", (req, res) => controller.getLogs(req, res));
router.get("/logs/phone/:phone", (req, res) => controller.getLogsByPhone(req, res));
router.get("/logs/appointment/:appointmentId", (req, res) => controller.getLogsByAppointment(req, res));
router.get("/logs/failed", (req, res) => controller.getFailedMessages(req, res));

export default router;
