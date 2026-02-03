import { Request, Response } from 'express';
import { WhatsAppLogDAO } from '../DAO/WhatsAppLogDAO';
import prismaClient from '../database/prisma';
import { makePrismaOptions } from '../functions/makePrismaOptions';
import { WhatsAppService } from '../services/WhatsAppService';

export class WhatsAppController {
    private whatsappService: WhatsAppService;

    constructor() {
        this.whatsappService = WhatsAppService.getInstance();
    }

    async getStatus(req: Request, res: Response): Promise<void> {
        try {
            const isReady = this.whatsappService.isClientReady();
            res.json({
                connected: isReady,
                message: isReady ? 'WhatsApp conectado' : 'WhatsApp não conectado'
            });
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            res.status(500).json({ error: 'Erro ao verificar status do WhatsApp' });
        }
    }

    async initialize(req: Request, res: Response): Promise<void> {
        try {
            await this.whatsappService.initialize();
            res.json({
                message: 'WhatsApp inicializado. Escaneie o QR Code no console do backend.'
            });
        } catch (error) {
            console.error('Erro ao inicializar WhatsApp:', error);
            res.status(500).json({ error: 'Erro ao inicializar WhatsApp' });
        }
    }

    async disconnect(req: Request, res: Response): Promise<void> {
        try {
            await this.whatsappService.disconnect();
            res.json({ message: 'WhatsApp desconectado com sucesso' });
        } catch (error) {
            console.error('Erro ao desconectar WhatsApp:', error);
            res.status(500).json({ error: 'Erro ao desconectar WhatsApp' });
        }
    }

    async sendTestMessage(req: Request, res: Response): Promise<void> {
        try {
            const { phone, message } = req.body;

            if (!phone || !message) {
                res.status(400).json({ error: 'Telefone e mensagem são obrigatórios' });
                return;
            }

            const success = await this.whatsappService.sendMessage(phone, message, 'TEST');

            if (success) {
                res.json({ message: 'Mensagem enviada com sucesso' });
            } else {
                res.status(500).json({ error: 'Falha ao enviar mensagem' });
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem de teste:', error);
            res.status(500).json({ error: 'Erro ao enviar mensagem' });
        }
    }

    async sendReminders(req: Request, res: Response): Promise<void> {
        try {
            await this.whatsappService.checkTomorrowAppointments();
            res.json({ message: 'Lembretes enviados com sucesso' });
        } catch (error) {
            console.error('Erro ao enviar lembretes:', error);
            res.status(500).json({ error: 'Erro ao enviar lembretes' });
        }
    }

    async getLogs(req: Request, res: Response): Promise<void> {
        try {
            await prismaClient.$transaction(async (tx) => {
                const logDAO = new WhatsAppLogDAO();
                logDAO.init(tx);

                const options = makePrismaOptions(res);
                const logs = await logDAO.get(options);

                res.json(logs);
            });
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
            res.status(500).json({ error: 'Erro ao buscar logs do WhatsApp' });
        }
    }

    async getLogsByPhone(req: Request, res: Response): Promise<void> {
        try {
            const phone = Array.isArray(req.params.phone) ? req.params.phone[0] : req.params.phone;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

            await prismaClient.$transaction(async (tx) => {
                const logDAO = new WhatsAppLogDAO();
                logDAO.init(tx);

                const logs = await logDAO.getByPhone(phone, limit);
                res.json(logs);
            });
        } catch (error) {
            console.error('Erro ao buscar logs por telefone:', error);
            res.status(500).json({ error: 'Erro ao buscar logs' });
        }
    }

    async getLogsByAppointment(req: Request, res: Response): Promise<void> {
        try {
            const appointmentId = Array.isArray(req.params.appointmentId) ? req.params.appointmentId[0] : req.params.appointmentId;

            await prismaClient.$transaction(async (tx) => {
                const logDAO = new WhatsAppLogDAO();
                logDAO.init(tx);

                const logs = await logDAO.getByAppointmentId(appointmentId);
                res.json(logs);
            });
        } catch (error) {
            console.error('Erro ao buscar logs por agendamento:', error);
            res.status(500).json({ error: 'Erro ao buscar logs' });
        }
    }

    async getFailedMessages(req: Request, res: Response): Promise<void> {
        try {
            await prismaClient.$transaction(async (tx) => {
                const logDAO = new WhatsAppLogDAO();
                logDAO.init(tx);

                const logs = await logDAO.getFailedMessages();
                res.json(logs);
            });
        } catch (error) {
            console.error('Erro ao buscar mensagens falhadas:', error);
            res.status(500).json({ error: 'Erro ao buscar mensagens falhadas' });
        }
    }
}
