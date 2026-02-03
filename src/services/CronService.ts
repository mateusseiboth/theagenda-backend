import cron from 'node-cron';
import { WhatsAppService } from '../services/WhatsAppService';

export class CronService {
    private static instance: CronService;
    private whatsappService: WhatsAppService;
    private cronJobs: cron.ScheduledTask[] = [];

    private constructor() {
        this.whatsappService = WhatsAppService.getInstance();
    }

    static getInstance(): CronService {
        if (!CronService.instance) {
            CronService.instance = new CronService();
        }
        return CronService.instance;
    }

    start(): void {
        console.log('📅 Iniciando serviço de cron jobs...');

        // Executar todos os dias às 10:00 para enviar lembretes dos agendamentos de amanhã
        const reminderJob = cron.schedule('0 10 * * *', async () => {
            console.log('⏰ Executando verificação de agendamentos para amanhã...');
            try {
                await this.whatsappService.checkTomorrowAppointments();
            } catch (error) {
                console.error('Erro ao executar verificação de agendamentos:', error);
            }
        }, {
            timezone: 'America/Sao_Paulo'
        });

        this.cronJobs.push(reminderJob);
        console.log('✅ Cron job agendado: Lembretes diários às 10:00');

        // Job para verificar conexão do WhatsApp a cada hora
        const statusJob = cron.schedule('0 * * * *', () => {
            const isReady = this.whatsappService.isClientReady();
            console.log(`📱 Status WhatsApp: ${isReady ? 'Conectado' : 'Desconectado'}`);
        }, {
            timezone: 'America/Sao_Paulo'
        });

        this.cronJobs.push(statusJob);
        console.log('✅ Cron job agendado: Verificação de status a cada hora');
    }

    stop(): void {
        console.log('🛑 Parando cron jobs...');
        this.cronJobs.forEach(job => job.stop());
        this.cronJobs = [];
        console.log('✅ Cron jobs parados');
    }
}
