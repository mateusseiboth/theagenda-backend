import { addCompanyIdToTransaction, getOrderBy, getPaginate, getWhere } from "@qualitysistemas/bun-commons";
import express from "express";
import { AppointmentController } from "../../../../controller/AppointmentController";
import prismaClient from "../../../../database/prisma";
import { authMiddleware as checkAuth } from "../../../../middlewares/auth";
import { checkPermissions } from "../../../../middlewares/checkPermissions";
import { AppointmentModel } from "../../../../model/AppointmentModel";

const router = express.Router();

// Rota pública para listar agendamentos (calendário público)
router.get("/public", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        const controller = new AppointmentController(tx);
        await controller.getPublic(req, res);
    });
});

// Criar agendamento (usuário comum pode criar)
router.post("/", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        const controller = new AppointmentController(tx, req.body);
        await controller.create(req, res);
    });
});

// Rotas protegidas
router.use(checkAuth);
router.use((req, res, next) => checkPermissions<AppointmentModel>(req, res, next, AppointmentModel));

// Cancelar agendamento
router.post("/:id/cancel", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        await addCompanyIdToTransaction(tx, res.locals.userInfo.entidade);
        const controller = new AppointmentController(tx);
        await controller.cancel(req, res);
    });
});

router.put("/:id", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        await addCompanyIdToTransaction(tx, res.locals.userInfo.entidade);
        const controller = new AppointmentController(tx, req.body);
        await controller.update(req, res);
    });
});

router.put("/", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        await addCompanyIdToTransaction(tx, res.locals.userInfo.entidade);
        const controller = new AppointmentController(tx, req.body);
        await controller.update(req, res);
    });
});

router.get("/:id", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        await addCompanyIdToTransaction(tx, res.locals.userInfo.entidade);
        const controller = new AppointmentController(tx);
        await controller.getById(req, res);
    });
});

router.delete("/:id", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        await addCompanyIdToTransaction(tx, res.locals.userInfo.entidade);
        const controller = new AppointmentController(tx);
        await controller.deleteById(req, res);
    });
});

router.use((req, res, next) => getOrderBy<AppointmentModel>(req, res, next, AppointmentModel));
router.use((req, res, next) => getWhere<AppointmentModel>(req, res, next, AppointmentModel));
router.use(getPaginate);

router.get("/", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        await addCompanyIdToTransaction(tx, res.locals.userInfo.entidade);
        const controller = new AppointmentController(tx);
        await controller.get(req, res);
    });
});

export default router;
