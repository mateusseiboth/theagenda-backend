import dayjs from 'dayjs';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import qrcode from 'qrcode-terminal';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import { WhatsAppLogDAO } from '../DAO/WhatsAppLogDAO';
import prismaClient from '../database/prisma';
import { WhatsAppLogModel } from '../model/WhatsAppLogModel';
import { WhatsAppMessageType } from '../prisma/generated/client';

export class WhatsAppService {
    private static instance: WhatsAppService;
    private client: Client | null = null;
    private isReady: boolean = false;
    private isInitializing: boolean = false;
    private readonly sessionPath = './whatsapp-session/session';

    private constructor() { }

    static getInstance(): WhatsAppService {
        if (!WhatsAppService.instance) {
            WhatsAppService.instance = new WhatsAppService();
        }
        return WhatsAppService.instance;
    }

    private cleanupLockFile(): void {
        try {
            // Remover SingletonLock
            const singletonLockPath = join(this.sessionPath, 'SingletonLock');
            if (existsSync(singletonLockPath)) {
                unlinkSync(singletonLockPath);
                console.log('🧹 SingletonLock removido');
            }

            // Remover lockfile (usado no Windows e verificado pelo Puppeteer)
            const lockfilePath = join(this.sessionPath, 'lockfile');
            if (existsSync(lockfilePath)) {
                unlinkSync(lockfilePath);
                console.log('🧹 lockfile removido');
            }
        } catch (error) {
            console.warn('⚠️  Não foi possível remover lockfiles:', error);
        }
    }

    private async forceCleanup(): Promise<void> {
        // Tentar destruir cliente existente
        if (this.client) {
            try {
                console.log('🔄 Encerrando cliente anterior...');
                await this.client.destroy();
                this.client = null;
                this.isReady = false;
                this.isInitializing = false;
            } catch (error) {
                console.warn('⚠️  Erro ao encerrar cliente anterior:', error);
            }
        }

        // Limpar lockfiles
        this.cleanupLockFile();

        // Aguardar um pouco para o sistema operacional liberar recursos
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    async initialize(): Promise<void> {
        if (this.client && this.isReady) {
            console.log('WhatsApp client já está inicializado e pronto');
            return;
        }

        if (this.isInitializing) {
            console.log('WhatsApp já está inicializando...');
            return;
        }

        // Forçar limpeza completa
        await this.forceCleanup();

        this.isInitializing = true;

        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './whatsapp-session'
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        // Evento: QR Code gerado
        this.client.on('qr', (qr) => {
            console.log('\n===========================================');
            console.log('QR CODE GERADO - Escaneie com o WhatsApp:');
            console.log('===========================================\n');
            qrcode.generate(qr, { small: true });
            console.log('\n===========================================\n');
        });

        // Evento: Cliente autenticado
        this.client.on('authenticated', () => {
            console.log('✅ WhatsApp autenticado com sucesso!');
        });

        // Evento: Cliente pronto
        this.client.on('ready', () => {
            console.log('✅ WhatsApp Client está pronto!');
            this.isReady = true;
            this.isInitializing = false;
            this.setupMessageListener();
        });

        // Evento: Desconectado
        this.client.on('disconnected', (reason) => {
            console.log('❌ WhatsApp desconectado:', reason);
            this.isReady = false;
            this.isInitializing = false;
            this.client = null;
        });

        // Evento: Erro de autenticação
        this.client.on('auth_failure', (msg) => {
            console.error('❌ Falha na autenticação do WhatsApp:', msg);
            this.isReady = false;
            this.isInitializing = false;
        });

        await this.client.initialize();
    }

    private setupMessageListener(): void {
        if (!this.client) return;

        this.client.on('message', async (message: Message) => {
            try {
                // Ignorar mensagens de grupos e status
                const chat = await message.getChat();
                if (chat.isGroup) return;

                const phone = message.from.replace('@c.us', '');
                const messageText = message.body.toLowerCase().trim();

                // Verificar se é uma resposta de confirmação
                if (messageText === 'sim' || messageText === 's') {
                    await this.handleConfirmation(phone, true);
                    await message.reply('✅ Agendamento confirmado! Obrigado. Te esperamos no horário marcado! 😊');
                } else if (messageText === 'não' || messageText === 'nao' || messageText === 'n') {
                    await this.handleConfirmation(phone, false);
                    await message.reply('❌ Agendamento cancelado. Se precisar reagendar, entre em contato conosco.');
                } else {
                    await message.reply('❓ Desculpe, não entendi sua mensagem. Por favor, responda com *SIM* para confirmar ou *NÃO* para cancelar seu agendamento.');
                }
            } catch (error) {
                console.error('Erro ao processar mensagem:', error);
            }
        });
    }

    private async handleConfirmation(phone: string, confirmed: boolean): Promise<void> {
        try {
            // Buscar agendamentos PENDENTES de confirmação para este telefone nas próximas 48h
            const appointments = await prismaClient.appointment.findMany({
                where: {
                    user: {
                        phone: phone.startsWith('+') ? phone : `+${phone}`
                    },
                    status: 'PENDING', // Buscar apenas agendamentos PENDENTES
                    startTime: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 48 * 60 * 60 * 1000) // Próximas 48h
                    }
                },
                include: {
                    specialty: true
                },
                orderBy: {
                    startTime: 'asc'
                }
            });

            if (appointments.length === 0) {
                console.log(`📝 Nenhum agendamento pendente encontrado para ${phone}`);
                return;
            }

            const status = confirmed ? 'CONFIRMED' : 'CANCELED';

            // Atualizar TODOS os agendamentos pendentes
            for (const appointment of appointments) {
                await prismaClient.appointment.update({
                    where: { id: appointment.id },
                    data: { status }
                });
                console.log(`📝 Agendamento ${appointment.id} (${appointment.specialty?.name}) atualizado para ${status}`);
            }
        } catch (error) {
            console.error('Erro ao processar confirmação:', error);
        }
    }

    async sendMessage(
        phone: string,
        message: string,
        messageType: WhatsAppMessageType = 'CUSTOM',
        appointmentId?: string
    ): Promise<boolean> {
        // Criar log inicial
        let logId: string | null = null;

        try {
            const log = await prismaClient.$transaction(async (tx) => {
                const logDAO = new WhatsAppLogDAO();
                logDAO.init(tx);

                return await logDAO.create({
                    phone,
                    message,
                    messageType,
                    status: 'PENDING',
                    appointmentId: appointmentId || null
                } as WhatsAppLogModel);
            });

            logId = log.id;

            if (!this.isReady || !this.client) {
                // Atualizar log como falha
                await prismaClient.$transaction(async (tx) => {
                    const logDAO = new WhatsAppLogDAO();
                    logDAO.init(tx);
                    await logDAO.update({
                        status: 'FAILED',
                        error: 'WhatsApp client não está pronto'
                    }, logId!);
                });

                console.error('WhatsApp client não está pronto');
                return false;
            }

            // Formatar número de telefone (remover caracteres não numéricos)
            let phoneNumber = phone.replace(/\D/g, '');

            // Adicionar código do país se não tiver
            if (!phoneNumber.startsWith('55')) {
                phoneNumber = '55' + phoneNumber;
            }

            // Verificar se o número está registrado no WhatsApp
            try {
                const numberId = await this.client.getNumberId(phoneNumber);

                if (!numberId || !numberId._serialized) {
                    throw new Error('Número não está registrado no WhatsApp');
                }

                // Usar o ID verificado pelo WhatsApp
                const chatId = numberId._serialized;
                await this.client.sendMessage(chatId, message);
            } catch (verifyError) {
                throw new Error(`Número inválido ou não registrado no WhatsApp: ${phoneNumber}`);
            }

            // Atualizar log como enviado
            await prismaClient.$transaction(async (tx) => {
                const logDAO = new WhatsAppLogDAO();
                logDAO.init(tx);
                await logDAO.update({
                    status: 'SENT',
                    sentAt: new Date()
                }, logId!);
            });

            console.log(`✅ Mensagem enviada para ${phone}`);
            return true;
        } catch (error) {
            // Atualizar log como falha
            if (logId) {
                await prismaClient.$transaction(async (tx) => {
                    const logDAO = new WhatsAppLogDAO();
                    logDAO.init(tx);
                    await logDAO.update({
                        status: 'FAILED',
                        error: error instanceof Error ? error.message : 'Erro desconhecido',
                        sentAt: new Date()
                    }, logId!);
                });
            }

            console.error(`❌ Erro ao enviar mensagem para ${phone}:`, error);
            return false;
        }
    }

    async sendAppointmentConfirmation(
        phone: string,
        clientName: string,
        specialty: string,
        date: Date,
        duration: number,
        appointmentId?: string
    ): Promise<boolean> {
        const formattedDate = dayjs(date).format('DD/MM/YYYY [às] HH:mm');

        // new Intl.DateTimeFormat('pt-BR', {
        //     day: '2-digit',
        //     month: '2-digit',
        //     year: 'numeric',
        //     hour: '2-digit',
        //     minute: '2-digit'
        // }).format(date);

        const message = `
🎉 *Agendamento Confirmado!*

Olá, ${clientName}! 

Seu agendamento foi realizado com sucesso! ✅

📋 *Detalhes:*
🔹 Serviço: ${specialty}
🔹 Data/Hora: ${formattedDate}
🔹 Duração: ${duration} minutos

📍 Aguardamos você! 

_Em caso de dúvidas, entre em contato conosco._
        `.trim();

        return this.sendMessage(phone, message, 'APPOINTMENT_CONFIRMATION', appointmentId);
    }

    async sendAdminConfirmation(
        phone: string,
        clientName: string,
        specialty: string,
        date: Date,
        duration: number,
        appointmentId?: string
    ): Promise<boolean> {
        const formattedDate = dayjs(date).format('DD/MM/YYYY [às] HH:mm');

        const message = `
✅ *Agendamento Confirmado pela Empresa!*

Olá, ${clientName}! 

Confirmamos seu agendamento! 🎉

📋 *Detalhes:*
🔹 Serviço: ${specialty}
🔹 Data/Hora: ${formattedDate}
🔹 Duração: ${duration} minutos

📍 Seu horário está confirmado! Te esperamos no dia e hora marcados.

💬 *Importante:* Se precisar cancelar ou reagendar, entre em contato conosco com antecedência.

_Obrigado pela preferência!_ 😊
        `.trim();

        return this.sendMessage(phone, message, 'APPOINTMENT_CONFIRMATION', appointmentId);
    }

    async sendReminderAndConfirmation(
        phone: string,
        clientName: string,
        specialty: string,
        date: Date,
        duration: number,
        appointmentId?: string
    ): Promise<boolean> {
        const formattedDate = dayjs(date).format('DD/MM/YYYY [às] HH:mm');

        const message = `
⏰ *Lembrete de Agendamento*

Olá, ${clientName}! 

Você tem um agendamento marcado para amanhã! 📅

📋 *Detalhes:*
🔹 Serviço: ${specialty}
🔹 Data/Hora: ${formattedDate}
🔹 Duração: ${duration} minutos

❓ *Confirma sua presença?*
➡️ Responda *SIM* para confirmar
➡️ Responda *NÃO* para cancelar

_Aguardamos sua confirmação!_ 😊
        `.trim();

        return this.sendMessage(phone, message, 'REMINDER', appointmentId);
    }

    async sendMultipleReminders(
        phone: string,
        clientName: string,
        appointments: Array<{ specialty: string; date: Date; duration: number; id: string }>
    ): Promise<boolean> {
        let appointmentsList = '';
        appointments.forEach((apt, index) => {
            const formattedDate = dayjs(apt.date).format('DD/MM/YYYY [às] HH:mm');
            appointmentsList += `\n${index + 1}. *${apt.specialty}*\n   📅 ${formattedDate} (${apt.duration} min)\n`;
        });

        const message = `
⏰ *Lembrete de Agendamentos*

Olá, ${clientName}! 

Você tem *${appointments.length} agendamentos* marcados para amanhã! 📅
${appointmentsList}
❓ *Confirma sua presença em todos?*
➡️ Responda *SIM* para confirmar todos
➡️ Responda *NÃO* para cancelar todos

_Aguardamos sua confirmação!_ 😊
        `.trim();

        return this.sendMessage(phone, message, 'REMINDER');
    }

    async checkTomorrowAppointments(): Promise<void> {
        if (!this.isReady) {
            console.log('WhatsApp não está pronto para enviar lembretes');
            return;
        }

        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);

            const appointments = await prismaClient.appointment.findMany({
                where: {
                    startTime: {
                        gte: tomorrow,
                        lt: dayAfter
                    },
                    status: 'PENDING', // Apenas agendamentos PENDENTES precisam de confirmação
                    enabled: true,
                    active: true
                },
                include: {
                    user: true,
                    specialty: true
                },
                orderBy: {
                    startTime: 'asc'
                }
            });

            console.log(`📞 Verificando ${appointments.length} agendamentos pendentes para amanhã...`);

            // Agrupar agendamentos por usuário
            const appointmentsByUser = new Map<string, typeof appointments>();

            for (const appointment of appointments) {
                if (appointment.user?.phone) {
                    const phone = appointment.user.phone;
                    if (!appointmentsByUser.has(phone)) {
                        appointmentsByUser.set(phone, []);
                    }
                    appointmentsByUser.get(phone)!.push(appointment);
                }
            }

            // Enviar mensagens agrupadas por usuário
            for (const [phone, userAppointments] of appointmentsByUser) {
                const user = userAppointments[0].user!;

                if (userAppointments.length === 1) {
                    // Se tem apenas um agendamento, enviar mensagem simples
                    const apt = userAppointments[0];
                    if (apt.specialty) {
                        await this.sendReminderAndConfirmation(
                            phone,
                            user.name || 'Cliente',
                            apt.specialty.name,
                            apt.startTime,
                            apt.specialty.avgDuration,
                            apt.id
                        );
                    }
                } else {
                    // Se tem múltiplos agendamentos, enviar mensagem agrupada
                    const appointmentsData = userAppointments
                        .filter(apt => apt.specialty)
                        .map(apt => ({
                            specialty: apt.specialty!.name,
                            date: apt.startTime,
                            duration: apt.specialty!.avgDuration,
                            id: apt.id
                        }));

                    await this.sendMultipleReminders(
                        phone,
                        user.name || 'Cliente',
                        appointmentsData
                    );
                }

                // Aguardar 2 segundos entre mensagens para evitar spam
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log('✅ Lembretes enviados com sucesso!');
        } catch (error) {
            console.error('Erro ao enviar lembretes:', error);
        }
    }

    isClientReady(): boolean {
        return this.isReady;
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            try {
                console.log('🛑 Encerrando WhatsApp client...');
                await this.client.destroy();
                this.client = null;
                this.isReady = false;
                this.isInitializing = false;
                console.log('✅ WhatsApp desconectado');
            } catch (error) {
                console.error('❌ Erro ao desconectar WhatsApp:', error);
            }
        }
    }
}
