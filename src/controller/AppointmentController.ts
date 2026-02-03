import { logDecorator } from '@qualitysistemas/bun-commons';
import { Request, Response } from 'express';
import { AppointmentDAO } from '../DAO/AppointmentDAO';
import { SpecialtyDAO } from '../DAO/SpecialtyDAO';
import { UserDAO } from '../DAO/UserDAO';
import { makePrismaOptions } from '../functions/makePrismaOptions';
import { AppointmentModel } from '../model/AppointmentModel';
import { AppointmentStatus, Prisma } from '../prisma/generated/client';
import { WhatsAppService } from '../services/WhatsAppService';
import { BaseController } from './BaseController';

@logDecorator
export class AppointmentController extends BaseController {
    data: AppointmentModel = {} as AppointmentModel;
    private DAO = new AppointmentDAO();
    private specialtyDAO = new SpecialtyDAO();
    private userDAO = new UserDAO();

    constructor(tx: Prisma.TransactionClient);
    constructor(tx: Prisma.TransactionClient, data: AppointmentModel);
    constructor(tx: Prisma.TransactionClient, data?: AppointmentModel) {
        super();
        if (data)
            this.data = new AppointmentModel(data);
        this.DAO.init(tx);
        this.specialtyDAO.init(tx);
        this.userDAO.init(tx);
    }

    async create(req: Request, res: Response) {
        this.data.modifiedBy = res.locals.userInfo?.id;

        // Extrair userName se vier no body
        const userName = (req.body as any).userName;

        // Se userId for um telefone (não UUID), criar ou buscar o usuário
        if (this.data.userId && !this.isValidUUID(this.data.userId)) {
            const phone = this.data.userId;
            let user = await this.userDAO.getByPhone(phone);

            if (!user) {
                // Criar novo usuário com o telefone e nome
                user = await this.userDAO.create({
                    phone,
                    name: userName || null,
                    role: 'USER',
                    enabled: true,
                    active: true
                } as any);
            } else if (userName && !user.name) {
                // Se o usuário já existe mas não tem nome, atualizar
                user = await this.userDAO.update({ name: userName } as any, user.id);
            }

            this.data.userId = user.id;
        }

        // Validar disponibilidade considerando agendamentos simultâneos
        const specialty = await this.specialtyDAO.getById(this.data.specialtyId);
        if (!specialty) {
            res.status(404).json({ error: 'Especialidade não encontrada' });
            return;
        }

        const simultaneousCount = await this.DAO.countSimultaneousAppointments(
            this.data.specialtyId,
            this.data.startTime,
            this.data.endTime
        );

        if (simultaneousCount >= specialty.maxSimultaneous) {
            res.status(409).json({
                error: 'Horário não disponível',
                message: `Limite de agendamentos simultâneos atingido (${specialty.maxSimultaneous})`
            });
            return;
        }

        if (this.data.id) {
            req.params.id = this.data.id;
            await this.update(req, res);
            return;
        }

        const response = await this.DAO.create(this.data);

        // Enviar mensagem de confirmação via WhatsApp
        try {
            const whatsappService = WhatsAppService.getInstance();
            if (whatsappService.isClientReady()) {
                const appointment = await this.DAO.getById(response.id);
                if (appointment) {
                    // Buscar dados do usuário e especialidade separadamente
                    const user = await this.userDAO.getById(appointment.userId);
                    const specialty = await this.specialtyDAO.getById(appointment.specialtyId);

                    if (user?.phone && specialty) {
                        await whatsappService.sendAppointmentConfirmation(
                            user.phone,
                            user.name || 'Cliente',
                            specialty.name,
                            appointment.startTime,
                            specialty.avgDuration,
                            appointment.id
                        );
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem de confirmação:', error);
            // Não bloquear a criação do agendamento se falhar o envio da mensagem
        }

        res.status(201).json(response);
    }

    async get(req: Request, res: Response) {
        const options = makePrismaOptions(res);
        const result = await this.DAO.get(options);
        res.status(200).json(result);
    }

    async getPublic(req: Request, res: Response) {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            res.status(400).json({ error: 'startDate e endDate são obrigatórios' });
            return;
        }

        const result = await this.DAO.getPublicAppointments(
            new Date(startDate as string),
            new Date(endDate as string)
        );
        res.json(result);
    }

    async getById(req: Request, res: Response) {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const result = await this.DAO.getById(id);
        res.status(200).json({ data: result, paginate: { total: 1 } });
    }

    async update(req: Request, res: Response) {
        let id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id) {
            id = this.data.id || '';
            if (!id) {
                res.status(400).json({ error: 'ID is required for update.' });
                return;
            }
        }

        // Se está atualizando horário, validar disponibilidade
        if (this.data.startTime || this.data.endTime || this.data.specialtyId) {
            const current = await this.DAO.getById(id);
            if (!current) {
                res.status(404).json({ error: 'Agendamento não encontrado' });
                return;
            }

            const specialtyId = this.data.specialtyId || current.specialtyId;
            const startTime = this.data.startTime || current.startTime;
            const endTime = this.data.endTime || current.endTime;

            const specialty = await this.specialtyDAO.getById(specialtyId);
            if (!specialty) {
                res.status(404).json({ error: 'Especialidade não encontrada' });
                return;
            }

            const simultaneousCount = await this.DAO.countSimultaneousAppointments(
                specialtyId,
                startTime,
                endTime,
                id
            );

            if (simultaneousCount >= specialty.maxSimultaneous) {
                res.status(409).json({
                    error: 'Horário não disponível',
                    message: `Limite de agendamentos simultâneos atingido (${specialty.maxSimultaneous})`
                });
                return;
            }
        }

        this.data.modifiedBy = res.locals.userInfo?.id;
        this.data.updatedAt = this.getNewDate();
        const response = await this.DAO.update(this.data, id);

        // Enviar mensagem de confirmação via WhatsApp se status mudou para CONFIRMED (confirmação manual pelo admin)
        if (this.data.status === 'CONFIRMED') {
            try {
                const whatsappService = WhatsAppService.getInstance();
                if (whatsappService.isClientReady()) {
                    const appointment = await this.DAO.getById(response.id);
                    if (appointment) {
                        const user = await this.userDAO.getById(appointment.userId);
                        const specialty = await this.specialtyDAO.getById(appointment.specialtyId);

                        if (user?.phone && specialty) {
                            // Usar método específico para confirmação manual pelo admin
                            await whatsappService.sendAdminConfirmation(
                                user.phone,
                                user.name || 'Cliente',
                                specialty.name,
                                appointment.startTime,
                                specialty.avgDuration,
                                appointment.id
                            );
                        }
                    }
                }
            } catch (error) {
                console.error('Erro ao enviar mensagem de confirmação:', error);
                // Não bloquear a atualização do agendamento se falhar o envio da mensagem
            }
        }

        res.status(200).json({ data: response, paginate: { total: 1 } });
    }

    async deleteById(req: Request, res: Response) {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        this.data.modifiedBy = res.locals.userInfo?.id;
        await this.DAO.deleteById({ id, userID: this.data.modifiedBy || '' });
        res.status(204).end();
    }

    async cancel(req: Request, res: Response) {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        (this.data as any).status = 'CANCELED' as AppointmentStatus;
        this.data.canceledAt = this.getNewDate();
        this.data.modifiedBy = res.locals.userInfo?.id;
        this.data.updatedAt = this.getNewDate();
        const response = await this.DAO.update(this.data, id);
        res.status(200).json({ data: response, paginate: { total: 1 } });
    }

    private isValidUUID(str: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    }
}
