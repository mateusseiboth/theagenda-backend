import { z } from "zod";

// Schemas de validação

export const createAppointmentSchema = z.object({
    phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
    name: z.string().optional(),
    serviceId: z.string().uuid("ID do serviço inválido"),
    startTime: z.string().datetime("Data/hora inválida"),
    notes: z.string().optional(),
});

export const updateAppointmentStatusSchema = z.object({
    status: z.enum(["PENDING", "CONFIRMED", "CANCELED", "COMPLETED", "NO_SHOW", "LATE"]),
    adminNotes: z.string().optional(),
});

export const loginSchema = z.object({
    phone: z.string().min(10, "Telefone inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const createServiceSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    description: z.string().optional(),
    duration: z.number().int().positive("Duração deve ser positiva"),
    price: z.number().nonnegative("Preço não pode ser negativo").optional(),
    enabled: z.boolean().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const availableSlotsSchema = z.object({
    serviceId: z.string().uuid("ID do serviço inválido"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)"),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type AvailableSlotsInput = z.infer<typeof availableSlotsSchema>;
