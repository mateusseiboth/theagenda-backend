-- CreateEnum
CREATE TYPE "whatsapp_message_type" AS ENUM ('APPOINTMENT_CONFIRMATION', 'REMINDER', 'TEST', 'CUSTOM');

-- CreateEnum
CREATE TYPE "whatsapp_message_status" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DELIVERED', 'READ');

-- CreateTable
CREATE TABLE "whatsapp_logs" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" "whatsapp_message_type" NOT NULL,
    "status" "whatsapp_message_status" NOT NULL DEFAULT 'PENDING',
    "appointmentId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "whatsapp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_logs_phone_idx" ON "whatsapp_logs"("phone");

-- CreateIndex
CREATE INDEX "whatsapp_logs_appointmentId_idx" ON "whatsapp_logs"("appointmentId");

-- CreateIndex
CREATE INDEX "whatsapp_logs_status_idx" ON "whatsapp_logs"("status");

-- CreateIndex
CREATE INDEX "whatsapp_logs_messageType_idx" ON "whatsapp_logs"("messageType");

-- CreateIndex
CREATE INDEX "whatsapp_logs_createdAt_idx" ON "whatsapp_logs"("createdAt");
