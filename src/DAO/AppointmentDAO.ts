import { convertBigIntValues, DAOFor, executePrismaQuery, filterObjectByModel, IResponsePaginate } from "@qualitysistemas/bun-commons";
import { AppointmentModel } from "../model/AppointmentModel";
import { BaseDAO } from "./base";

@DAOFor(AppointmentModel.tag)
export class AppointmentDAO extends BaseDAO {
    async create(data: AppointmentModel): Promise<AppointmentModel> {
        const filteredData = filterObjectByModel(data, AppointmentModel);

        const newAppointment = await this.tx.appointment.create({
            data: filteredData as any,
            include: {
                user: true,
                specialty: true
            }
        });
        return convertBigIntValues(newAppointment) as unknown as AppointmentModel;
    }

    async get(options: any): Promise<IResponsePaginate<AppointmentModel>> {
        const customOptions = {
            ...options,
            include: {
                user: true,
                specialty: true
            }
        };
        return await executePrismaQuery<AppointmentModel>(this.tx.appointment, customOptions);
    }

    async getById(id: string): Promise<AppointmentModel | null> {
        const appointment = await this.tx.appointment.findUniqueOrThrow({
            where: { id },
            include: {
                user: true,
                specialty: true
            }
        });
        return convertBigIntValues(appointment) as unknown as AppointmentModel;
    }

    async getPublicAppointments(startDate: Date, endDate: Date): Promise<any[]> {
        const appointments = await this.tx.appointment.findMany({
            where: {
                enabled: true,
                active: true,
                status: { not: 'CANCELED' },
                startTime: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                specialty: {
                    select: {
                        id: true,
                        name: true,
                        avgDuration: true,
                        maxSimultaneous: true
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        });
        return convertBigIntValues(appointments) as any[];
    }

    async countSimultaneousAppointments(specialtyId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<number> {
        const where: any = {
            specialtyId,
            enabled: true,
            active: true,
            status: { notIn: ['CANCELED', 'NO_SHOW'] },
            OR: [
                {
                    AND: [
                        { startTime: { lt: endTime } },
                        { endTime: { gt: startTime } }
                    ]
                }
            ]
        };

        if (excludeId) {
            where.id = { not: excludeId };
        }

        return await this.tx.appointment.count({ where });
    }

    async update(data: Partial<AppointmentModel>, id: string): Promise<AppointmentModel> {
        const updateData: any = { ...filterObjectByModel(data, AppointmentModel) };

        const updatedAppointment = await this.tx.appointment.update({
            where: { id },
            data: updateData,
            include: {
                user: true,
                specialty: true
            }
        });
        return convertBigIntValues(updatedAppointment) as unknown as AppointmentModel;
    }

    async deleteById({ id, userID }: { id: string, userID: string }): Promise<void> {
        await this.tx.appointment.update({
            where: { id },
            data: {
                enabled: false,
                active: false,
                modifiedBy: userID
            }
        });
    }
}
