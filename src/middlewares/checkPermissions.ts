import { NextFunction, Request, Response } from "express";
import { TokenExpiredError, verify } from 'jsonwebtoken';
import { config } from "../config";

export async function checkPermissions<T>(req: Request, res: Response, next: NextFunction, classBase: { tag: number }) {
    if (process.env.NODE_ENV === 'development' && req.headers.origin === "chrome-extension://amknoiejhlmhancpahfcfcfhllgkpbld") {
        res.locals.userInfo = {
            id: 'dev-user',
            entidade: res.locals.entity,
            isQuality: true,
        }
        next();
        return;
    }

    const tagPage = classBase.tag;
    const token = req.headers.authorization;
    if (!token) {
        res.status(403).send({ message: 'Você não tem permissão para acessar este recurso' });
        return;
    }

    let user: any;
    try {
        user = verify(token.split(" ")[1], config.jwtSecret);
        res.locals.userInfo = user;
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            res.status(401).send({ message: 'Token expirado' });
        } else {
            res.status(403).send({ message: 'Token inválido' });
        }
        return;
    }

    next();
}
