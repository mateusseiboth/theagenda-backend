import { convertBigIntValues, DAOFor, executePrismaQuery, filterObjectByModel, IResponsePaginate } from "@qualitysistemas/bun-commons";
import { WhatsAppLogModel } from "../model/WhatsAppLogModel";
import { BaseDAO } from "./base";

@DAOFor(WhatsAppLogModel.tag)
export class WhatsAppLogDAO extends BaseDAO {
    async create(data: WhatsAppLogModel): Promise<WhatsAppLogModel> {
        const filteredData = filterObjectByModel(data, WhatsAppLogModel);

        const newLog = await this.tx.whatsAppLog.create({
            data: filteredData as any
        });
        return convertBigIntValues(newLog) as unknown as WhatsAppLogModel;
    }

    async get(options: any): Promise<IResponsePaginate<WhatsAppLogModel>> {
        return await executePrismaQuery<WhatsAppLogModel>(this.tx.whatsAppLog, options);
    }

    async getById(id: string): Promise<WhatsAppLogModel | null> {
        const log = await this.tx.whatsAppLog.findUniqueOrThrow({
            where: { id }
        });
        return convertBigIntValues(log) as unknown as WhatsAppLogModel;
    }

    async update(data: Partial<WhatsAppLogModel>, id: string): Promise<WhatsAppLogModel> {
        const filteredData = filterObjectByModel(data, WhatsAppLogModel);

        const updatedLog = await this.tx.whatsAppLog.update({
            where: { id },
            data: filteredData as any
        });
        return convertBigIntValues(updatedLog) as unknown as WhatsAppLogModel;
    }

    async getByAppointmentId(appointmentId: string): Promise<WhatsAppLogModel[]> {
        const logs = await this.tx.whatsAppLog.findMany({
            where: { appointmentId },
            orderBy: { createdAt: 'desc' }
        });
        return convertBigIntValues(logs) as unknown as WhatsAppLogModel[];
    }

    async getByPhone(phone: string, limit: number = 50): Promise<WhatsAppLogModel[]> {
        const logs = await this.tx.whatsAppLog.findMany({
            where: { phone },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        return convertBigIntValues(logs) as unknown as WhatsAppLogModel[];
    }

    async getRecentLogs(limit: number = 100): Promise<WhatsAppLogModel[]> {
        const logs = await this.tx.whatsAppLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        return convertBigIntValues(logs) as unknown as WhatsAppLogModel[];
    }

    async getFailedMessages(): Promise<WhatsAppLogModel[]> {
        const logs = await this.tx.whatsAppLog.findMany({
            where: {
                status: 'FAILED'
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        return convertBigIntValues(logs) as unknown as WhatsAppLogModel[];
    }
}
