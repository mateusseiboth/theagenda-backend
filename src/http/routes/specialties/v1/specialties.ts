import { addCompanyIdToTransaction, getOrderBy, getPaginate, getWhere } from "@qualitysistemas/bun-commons";
import express from "express";
import { SpecialtyController } from "../../../../controller/SpecialtyController";
import prismaClient from "../../../../database/prisma";
import { authMiddleware as checkAuth } from "../../../../middlewares/auth";
import { checkPermissions } from "../../../../middlewares/checkPermissions";
import { SpecialtyModel } from "../../../../model/SpecialtyModel";

const router = express.Router();

// Rota pública para listar especialidades disponíveis
router.get("/public", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        const controller = new SpecialtyController(tx);
        await controller.getPublic(req, res);
    });
});

// Rotas protegidas
router.use((req, res, next) => checkPermissions<SpecialtyModel>(req, res, next, SpecialtyModel));
router.use(checkAuth);

router.post("/", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        await addCompanyIdToTransaction(tx, res.locals.userInfo.entidade);
        const controller = new SpecialtyController(tx, req.body);
        await controller.create(req, res);
    });
});

router.put("/", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        await addCompanyIdToTransaction(tx, res.locals.userInfo.entidade);
        const controller = new SpecialtyController(tx, req.body);
        await controller.update(req, res);
    });
});

router.get("/:id", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        await addCompanyIdToTransaction(tx, res.locals.userInfo.entidade);
        const controller = new SpecialtyController(tx);
        await controller.getById(req, res);
    });
});

router.delete("/:id", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        await addCompanyIdToTransaction(tx, res.locals.userInfo.entidade);
        const controller = new SpecialtyController(tx);
        await controller.deleteById(req, res);
    });
});

router.use((req, res, next) => getOrderBy<SpecialtyModel>(req, res, next, SpecialtyModel));
router.use((req, res, next) => getWhere<SpecialtyModel>(req, res, next, SpecialtyModel));
router.use(getPaginate);

router.get("/", async (req, res) => {
    await prismaClient.$transaction(async (tx) => {
        await addCompanyIdToTransaction(tx, res.locals.userInfo.entidade);
        const controller = new SpecialtyController(tx);
        await controller.get(req, res);
    });
});

export default router;
