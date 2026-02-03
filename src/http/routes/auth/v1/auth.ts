import argon2 from "argon2";
import express from "express";
import jwt from "jsonwebtoken";
import { config } from "../../../../config";
import { UserDAO } from "../../../../DAO/UserDAO";
import prismaClient from "../../../../database/prisma";
import { UserModel } from "../../../../model/UserModel";

const router = express.Router();

// Login
router.post("/login", async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        res.status(400).json({ error: "Telefone e senha são obrigatórios" });
        return;
    }

    await prismaClient.$transaction(async (tx) => {
        const userDao = new UserDAO();
        userDao.init(tx);

        const user = await userDao.getByPhone(phone);

        if (!user || !user.password) {
            res.status(401).json({ error: "Credenciais inválidas" });
            return;
        }

        const validPassword = await argon2.verify(user.password, password);

        if (!validPassword) {
            res.status(401).json({ error: "Credenciais inválidas" });
            return;
        }

        if (user.role !== 'ADMIN') {
            res.status(403).json({ error: "Apenas administradores podem fazer login" });
            return;
        }

        const token = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            config.jwtSecret
        );

        res.json({
            token,
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                role: user.role
            }
        });
    });
});

// Registro de usuário comum (para agendamento)
router.post("/register", async (req, res) => {
    const { phone, name } = req.body;

    if (!phone) {
        res.status(400).json({ error: "Telefone é obrigatório" });
        return;
    }

    await prismaClient.$transaction(async (tx) => {
        const userDao = new UserDAO();
        userDao.init(tx);

        const existingUser = await userDao.getByPhone(phone);

        if (existingUser) {
            res.json({
                user: {
                    id: existingUser.id,
                    phone: existingUser.phone,
                    name: existingUser.name,
                    role: existingUser.role
                }
            });
            return;
        }

        const userModel = new UserModel({
            phone,
            name: name || null,
            role: 'USER',
            password: null
        } as any);

        const newUser = await userDao.create(userModel);

        res.status(201).json({
            user: {
                id: newUser.id,
                phone: newUser.phone,
                name: newUser.name,
                role: newUser.role
            }
        });
    });
});

export default router;
