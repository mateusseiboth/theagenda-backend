import express from "express";
import { ReportsController } from "../../../../controller/ReportsController";
import prismaClient from "../../../../database/prisma";
import { authMiddleware as checkAuth } from "../../../../middlewares/auth";
import { checkPermissions } from "../../../../middlewares/checkPermissions";
import { AppointmentModel } from "../../../../model/AppointmentModel";

const router = express.Router();

// Todas as rotas de relatórios precisam de autenticação
router.use(checkAuth);
router.use((req, res, next) => checkPermissions<AppointmentModel>(req, res, next, AppointmentModel));

router.get("/monthly", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        const controller = new ReportsController(tx);
        await controller.getMonthlyReport(req, res);
    });
});

export default router;
