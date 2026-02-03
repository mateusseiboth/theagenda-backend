import { logDecorator } from '@qualitysistemas/bun-commons';
import { Request, Response } from 'express';
import { ConfigDAO } from '../DAO/ConfigDAO';
import { ConfigModel } from '../model/ConfigModel';
import { Prisma } from '../prisma/generated/client';
import { BaseController } from './BaseController';

@logDecorator
export class ConfigController extends BaseController {
    data: ConfigModel = {} as ConfigModel;
    private DAO = new ConfigDAO();

    constructor(tx: Prisma.TransactionClient);
    constructor(tx: Prisma.TransactionClient, data: ConfigModel);
    constructor(tx: Prisma.TransactionClient, data?: ConfigModel) {
        super();
        if (data)
            this.data = new ConfigModel(data);
        this.DAO.init(tx);
    }

    async get(req: Request, res: Response) {
        const result = await this.DAO.get();
        if (!result) {
            res.status(404).json({ error: 'Configuração não encontrada' });
            return;
        }
        res.status(200).json({ data: result, paginate: { total: 1 } });
    }

    async update(req: Request, res: Response) {
        const config = await this.DAO.get();
        if (!config) {
            res.status(404).json({ error: 'Configuração não encontrada' });
            return;
        }
        this.data.modifiedBy = res.locals.userInfo.id;
        this.data.updatedAt = this.getNewDate();
        const response = await this.DAO.update(this.data, config.id);
        res.status(200).json({ data: response, paginate: { total: 1 } });
    }

    async upsert(req: Request, res: Response) {
        this.data.modifiedBy = res.locals.userInfo?.id;
        const response = await this.DAO.upsert(this.data);
        res.status(200).json({ data: response, paginate: { total: 1 } });
    }
}
