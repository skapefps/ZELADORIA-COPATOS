-- CreateTable
CREATE TABLE "ReportMessageMention" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportMessageMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "actorId" INTEGER,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "reportId" INTEGER,
    "messageId" INTEGER,
    "privateConversationId" INTEGER,
    "privateMessageId" INTEGER,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateConversation" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateConversationParticipant" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateMessage" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "publicId" TEXT,
    "resourceType" TEXT DEFAULT 'text',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateMessageRead" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "lastReadMessageId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateMessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportMessageMention_messageId_idx" ON "ReportMessageMention"("messageId");

-- CreateIndex
CREATE INDEX "ReportMessageMention_employeeId_idx" ON "ReportMessageMention"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportMessageMention_messageId_employeeId_key" ON "ReportMessageMention"("messageId", "employeeId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_idx" ON "Notification"("recipientId");

-- CreateIndex
CREATE INDEX "Notification_actorId_idx" ON "Notification"("actorId");

-- CreateIndex
CREATE INDEX "Notification_reportId_idx" ON "Notification"("reportId");

-- CreateIndex
CREATE INDEX "Notification_messageId_idx" ON "Notification"("messageId");

-- CreateIndex
CREATE INDEX "Notification_privateConversationId_idx" ON "Notification"("privateConversationId");

-- CreateIndex
CREATE INDEX "Notification_privateMessageId_idx" ON "Notification"("privateMessageId");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "PrivateConversation_updatedAt_idx" ON "PrivateConversation"("updatedAt");

-- CreateIndex
CREATE INDEX "PrivateConversationParticipant_conversationId_idx" ON "PrivateConversationParticipant"("conversationId");

-- CreateIndex
CREATE INDEX "PrivateConversationParticipant_employeeId_idx" ON "PrivateConversationParticipant"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateConversationParticipant_conversationId_employeeId_key" ON "PrivateConversationParticipant"("conversationId", "employeeId");

-- CreateIndex
CREATE INDEX "PrivateMessage_conversationId_idx" ON "PrivateMessage"("conversationId");

-- CreateIndex
CREATE INDEX "PrivateMessage_senderId_idx" ON "PrivateMessage"("senderId");

-- CreateIndex
CREATE INDEX "PrivateMessage_createdAt_idx" ON "PrivateMessage"("createdAt");

-- CreateIndex
CREATE INDEX "PrivateMessageRead_conversationId_idx" ON "PrivateMessageRead"("conversationId");

-- CreateIndex
CREATE INDEX "PrivateMessageRead_employeeId_idx" ON "PrivateMessageRead"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateMessageRead_conversationId_employeeId_key" ON "PrivateMessageRead"("conversationId", "employeeId");

-- AddForeignKey
ALTER TABLE "ReportMessageMention" ADD CONSTRAINT "ReportMessageMention_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ReportMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportMessageMention" ADD CONSTRAINT "ReportMessageMention_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ReportMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_privateConversationId_fkey" FOREIGN KEY ("privateConversationId") REFERENCES "PrivateConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_privateMessageId_fkey" FOREIGN KEY ("privateMessageId") REFERENCES "PrivateMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateConversationParticipant" ADD CONSTRAINT "PrivateConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "PrivateConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateConversationParticipant" ADD CONSTRAINT "PrivateConversationParticipant_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateMessage" ADD CONSTRAINT "PrivateMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "PrivateConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateMessage" ADD CONSTRAINT "PrivateMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateMessageRead" ADD CONSTRAINT "PrivateMessageRead_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateMessageRead" ADD CONSTRAINT "PrivateMessageRead_lastReadMessageId_fkey" FOREIGN KEY ("lastReadMessageId") REFERENCES "PrivateMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
