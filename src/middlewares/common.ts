import { NextFunction, Request, Response } from "express";

export function getOrderBy(req: Request, res: Response, next: NextFunction): void {
    try {
        const { orderBy } = req.body;
        req.body.orderBy = orderBy || { createdAt: 'desc' };
        next();
    } catch (error) {
        next(error);
    }
}

export function getWhere(req: Request, res: Response, next: NextFunction): void {
    try {
        const { where } = req.body;
        req.body.where = where || {};
        next();
    } catch (error) {
        next(error);
    }
}

export function getPaginate(req: Request, res: Response, next: NextFunction): void {
    try {
        const { paginate } = req.body;
        const defaultPaginate = { skip: 0, take: 50 };

        if (paginate) {
            req.body.paginate = {
                skip: paginate.skip !== undefined ? paginate.skip : defaultPaginate.skip,
                take: paginate.take !== undefined ? paginate.take : defaultPaginate.take
            };
        } else {
            req.body.paginate = defaultPaginate;
        }

        next();
    } catch (error) {
        next(error);
    }
}

export function checkPermissions(permissions: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const userRole = res.locals.userInfo?.role;

            // Admin tem todas as permissões
            if (userRole === 'ADMIN') {
                next();
                return;
            }

            // Verifica se o usuário tem alguma das permissões necessárias
            if (permissions.length === 0) {
                next();
                return;
            }

            res.status(403).json({ error: "Sem permissão para acessar este recurso" });
        } catch (error) {
            next(error);
        }
    };
}
