import { logDecorator } from '@qualitysistemas/bun-commons';
import { Request, Response } from 'express';
import { UserDAO } from '../DAO/UserDAO';
import { makePrismaOptions } from '../functions/makePrismaOptions';
import { UserModel } from '../model/UserModel';
import { Prisma } from '../prisma/generated/client';
import { BaseController } from './BaseController';

@logDecorator
export class UserController extends BaseController {
    data: UserModel = {} as UserModel;
    private DAO = new UserDAO();

    constructor(tx: Prisma.TransactionClient);
    constructor(tx: Prisma.TransactionClient, data: UserModel);
    constructor(tx: Prisma.TransactionClient, data?: UserModel) {
        super();
        if (data)
            this.data = new UserModel(data);
        this.DAO.init(tx);
    }

    async create(req: Request, res: Response) {
        this.data.modifiedBy = res.locals.userInfo.id;
        if (this.data.id) {
            req.params.id = this.data.id;
            await this.update(req, res);
            return;
        }
        const response = await this.DAO.create(this.data);
        res.status(201).json(response);
    }

    async get(req: Request, res: Response) {
        const options = makePrismaOptions(res);
        const result = await this.DAO.get(options);
        res.status(200).json(result);
    }

    async getById(req: Request, res: Response) {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const result = await this.DAO.getById(id);
        res.status(200).json({ data: result, paginate: { total: 1 } });
    }

    async update(req: Request, res: Response) {
        let id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id || this.data.id || '');
        if (!id) {
            res.status(400).json({ error: 'ID is required for update.' });
            return;
        }
        this.data.modifiedBy = res.locals.userInfo.id;
        this.data.updatedAt = this.getNewDate();
        const response = await this.DAO.update(this.data, id);
        res.status(200).json({ data: response, paginate: { total: 1 } });
    }

    async deleteById(req: Request, res: Response) {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        this.data.modifiedBy = res.locals.userInfo.id;
        await this.DAO.deleteById({ id, userID: this.data.modifiedBy || '' });
        res.status(204).end();
    }
}
