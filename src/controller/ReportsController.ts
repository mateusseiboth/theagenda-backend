import { logDecorator } from '@qualitysistemas/bun-commons';
import { Request, Response } from 'express';
import { Prisma } from '../prisma/generated/client';

@logDecorator
export class ReportsController {
    constructor(private tx: Prisma.TransactionClient) { }

    async getMonthlyReport(req: Request, res: Response) {
        try {
            const { year, month } = req.query;
            const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
            const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;

            // Data inicial e final do mês
            const startDate = new Date(currentYear, currentMonth - 1, 1);
            const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

            // Buscar todos os agendamentos do mês (exceto cancelados)
            const appointments = await this.tx.appointment.findMany({
                where: {
                    startTime: {
                        gte: startDate,
                        lte: endDate
                    },
                    status: { notIn: ['CANCELED'] },
                    enabled: true,
                    active: true
                },
                include: {
                    specialty: true,
                    user: true
                }
            });

            // Calcular métricas por especialidade
            const specialtyStats = appointments.reduce((acc: any, apt) => {
                const specialtyId = apt.specialtyId;
                const specialtyName = apt.specialty?.name || 'Sem especialidade';

                if (!acc[specialtyId]) {
                    acc[specialtyId] = {
                        id: specialtyId,
                        name: specialtyName,
                        count: 0,
                        totalValue: 0,
                        completedCount: 0,
                        completedValue: 0
                    };
                }

                acc[specialtyId].count++;
                acc[specialtyId].totalValue += apt.specialty?.price || 0;

                if (apt.status === 'COMPLETED') {
                    acc[specialtyId].completedCount++;
                    acc[specialtyId].completedValue += apt.specialty?.price || 0;
                }

                return acc;
            }, {});

            // Converter para array e ordenar
            const specialtyArray = Object.values(specialtyStats);
            const bestByRevenue = [...specialtyArray].sort((a: any, b: any) => b.completedValue - a.completedValue)[0];
            const bestByCount = [...specialtyArray].sort((a: any, b: any) => b.completedCount - a.completedCount)[0];

            // Calcular dias mais movimentados
            const dayStats = appointments.reduce((acc: any, apt) => {
                const dayOfWeek = new Date(apt.startTime).getDay();
                const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                const dayName = dayNames[dayOfWeek];

                if (!acc[dayOfWeek]) {
                    acc[dayOfWeek] = {
                        day: dayName,
                        count: 0,
                        value: 0
                    };
                }

                acc[dayOfWeek].count++;
                if (apt.status === 'COMPLETED') {
                    acc[dayOfWeek].value += apt.specialty?.price || 0;
                }

                return acc;
            }, {});

            // Calcular horários mais movimentados
            const hourStats = appointments.reduce((acc: any, apt) => {
                const hour = new Date(apt.startTime).getHours();

                if (!acc[hour]) {
                    acc[hour] = {
                        hour: `${hour.toString().padStart(2, '0')}:00`,
                        count: 0,
                        value: 0
                    };
                }

                acc[hour].count++;
                if (apt.status === 'COMPLETED') {
                    acc[hour].value += apt.specialty?.price || 0;
                }

                return acc;
            }, {});

            // Calcular totais
            const totalAppointments = appointments.length;
            const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
            const totalRevenue = appointments
                .filter(a => a.status === 'COMPLETED')
                .reduce((sum, apt) => sum + (apt.specialty?.price || 0), 0);
            const averageTicket = completedAppointments > 0 ? totalRevenue / completedAppointments : 0;

            // Status breakdown
            const statusStats = appointments.reduce((acc: any, apt) => {
                acc[apt.status] = (acc[apt.status] || 0) + 1;
                return acc;
            }, {});

            res.json({
                period: {
                    year: currentYear,
                    month: currentMonth,
                    startDate,
                    endDate
                },
                summary: {
                    totalAppointments,
                    completedAppointments,
                    completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments * 100).toFixed(2) : 0,
                    totalRevenue,
                    averageTicket: averageTicket.toFixed(2),
                    statusBreakdown: statusStats
                },
                specialties: specialtyArray,
                bestSpecialty: {
                    byRevenue: bestByRevenue,
                    byCount: bestByCount
                },
                busiestDays: Object.values(dayStats).sort((a: any, b: any) => b.count - a.count),
                busiestHours: Object.values(hourStats).sort((a: any, b: any) => b.count - a.count)
            });
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            res.status(500).json({ error: 'Erro ao gerar relatório' });
        }
    }
}
