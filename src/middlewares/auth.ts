import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AuthRequest extends Request {
    userId?: string;
    userRole?: string;
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({ error: "Token não fornecido" });
            return;
        }

        const decoded = jwt.verify(token, config.jwtSecret) as {
            userId: string;
            role: string;
        };

        req.userId = decoded.userId;
        req.userRole = decoded.role;

        next();
    } catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }
};

export const adminMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (req.userRole !== "ADMIN") {
        res.status(403).json({ error: "Acesso negado. Apenas administradores." });
        return;
    }
    next();
};


export const checkAuth = authMiddleware;