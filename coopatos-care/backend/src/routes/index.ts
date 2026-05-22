import { Router } from "express";
import { io } from "../server.js";
import { prisma } from "../prisma/client.js";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const reportInclude = {
  employee: true,
  category: true,
  status: true,
  images: true,
  participants: {
    include: {
      employee: true,
    },
  },
  _count: {
    select: {
      messages: true,
    },
  },
};

const messageInclude = {
  sender: {
    select: {
      id: true,
      name: true,
      department: true,
    },
  },
  replyToMessage: {
    select: {
      id: true,
      senderName: true,
      message: true,
    },
  },
  media: true,
};

const mailTransporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

router.post("/employee/recover-registration", async (req, res) => {
  const { email, cpf } = req.body;

  if (!email || !cpf) {
    return res.status(400).json({
      error: "E-mail e CPF são obrigatórios.",
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const cleanCpf = String(cpf).replace(/\D/g, "");

  const employee = await prisma.employee.findFirst({
    where: {
      email: normalizedEmail,
      deletedAt: null,
    },
  });

  const isValidEmployee =
    employee && employee.cpf.replace(/\D/g, "") === cleanCpf;

  if (!isValidEmployee) {
    return res.status(404).json({
      error: "Não encontramos funcionário com esses dados.",
    });
  }

  try {
    await mailTransporter.sendMail({
      from: process.env.MAIL_FROM,
      to: employee.email!,
      subject: "Recuperação de matrícula - Zeladoria Coopatos",
      html: `
        <div style="font-family: Arial, sans-serif; background:#f3f4f6; padding:28px;">
          <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e5e7eb;">
            
            <div style="background:#0f5132; padding:24px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:22px;">
                Zeladoria Coopatos
              </h1>
              <p style="color:#d1fae5; margin:6px 0 0; font-size:14px;">
                Recuperação de acesso
              </p>
            </div>

            <div style="padding:28px;">
              <h2 style="color:#111827; margin-top:0;">
                Olá, ${employee.name}!
              </h2>

              <p style="font-size:15px; color:#374151; line-height:1.6;">
                Recebemos uma solicitação para recuperar sua matrícula de acesso ao sistema de Zeladoria Coopatos.
              </p>

              <p style="font-size:15px; color:#374151; line-height:1.6;">
                Encontramos seu cadastro com os dados informados:
              </p>

              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:14px; padding:18px; margin:22px 0;">
                <p style="margin:6px 0; font-size:15px;">
                  <strong>Nome completo:</strong> ${employee.name}
                </p>

                <p style="margin:6px 0; font-size:15px;">
                  <strong>Matrícula:</strong> 
                  <span style="font-size:18px; color:#0f5132; font-weight:700;">
                    ${employee.registrationNumber}
                  </span>
                </p>

                <p style="margin:6px 0; font-size:15px;">
                  <strong>Departamento:</strong> ${employee.department || "Não informado"}
                </p>
              </div>

              <p style="font-size:14px; color:#6b7280; line-height:1.6;">
                Utilize essa matrícula junto ao seu CPF para acessar novamente o sistema.
              </p>

              <p style="font-size:13px; color:#9ca3af; line-height:1.6;">
                Caso você não tenha solicitado essa recuperação, apenas ignore este e-mail.
              </p>
            </div>

            <div style="border-top:1px solid #e5e7eb; padding:20px; text-align:center;">
              <img
                src="https://zeladoria-coopatos.vercel.app/logo-coopatos.png"
                alt="Coopatos"
                style="max-width:130px; margin-bottom:8px;"
              />

              <p style="font-size:12px; color:#6b7280; margin:0;">
                Coopatos - Sempre presente!
              </p>
            </div>
          </div>
        </div>
      `,
    });

    return res.json({
      message: "Matrícula enviada para o e-mail cadastrado.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Falha ao enviar e-mail.",
    });
  }
});


router.get("/", (req, res) => {
  return res.json({
    message: "API funcionando",
  });
});

router.get("/employees", async (req, res) => {
  const employees = await prisma.employee.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      registrationNumber: true,
      department: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return res.json(employees);
});

router.get("/categories", async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return res.json(categories);
});

router.get("/statuses", async (req, res) => {
  const statuses = await prisma.reportStatus.findMany();

  return res.json(statuses);
});

router.get("/reports", async (req, res) => {
  const reports = await prisma.report.findMany({
    include: reportInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.json(reports);
});

router.get("/employees/:employeeId/participating-reports", async (req, res) => {
  const employeeId = Number(req.params.employeeId);

  const reports = await prisma.report.findMany({
    where: {
      participants: {
        some: {
          employeeId,
        },
      },
    },
    include: reportInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.json(reports);
});

router.post("/reports/:id/participants", async (req, res) => {
  const reportId = Number(req.params.id);
  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({
      error: "Funcionário é obrigatório.",
    });
  }

  const participant = await prisma.reportParticipant.upsert({
    where: {
      reportId_employeeId: {
        reportId,
        employeeId: Number(employeeId),
      },
    },
    update: {},
    create: {
      reportId,
      employeeId: Number(employeeId),
      role: "PARTICIPANT",
    },
    include: {
      employee: true,
    },
  });

   io.emit("participant-added");
io.emit("reports-updated");

  return res.status(201).json(participant);
});

router.delete("/reports/:id/participants/:participantId", async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    const participantId = Number(req.params.participantId);
    const { employeeId } = req.body;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        participants: true,
      },
    });

    if (!report) {
      return res.status(404).json({ error: "Chamado não encontrado." });
    }

    if (report.employeeId !== Number(employeeId)) {
      return res.status(403).json({
        error: "Apenas o criador do chamado pode remover participantes.",
      });
    }

    const participant = await prisma.reportParticipant.findFirst({
      where: {
        id: participantId,
        reportId,
      },
    });

    if (!participant) {
      return res.status(404).json({ error: "Participante não encontrado." });
    }

    await prisma.reportParticipant.delete({
      where: {
        id: participantId,
      },
    });

    io.emit("participant-removed");
io.emit("reports-updated");

    return res.json({
      message: "Participante removido com sucesso.",
      participantId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao remover participante.",
    });
  }
});

router.post("/reports", async (req, res) => {
  const {
    employeeId,
    categoryId,
    title,
    description,
    referencePoint,
    latitude,
    longitude,
    address,
    mediaItems,
  } = req.body;

  console.log("BODY RECEBIDO:", req.body);

  const openStatus = await prisma.reportStatus.findFirst({
    where: {
      name: "ABERTO",
    },
  });

  if (!openStatus) {
    return res.status(400).json({
      error: "Status ABERTO não encontrado.",
    });
  }

  const report = await prisma.report.create({
    data: {
      employeeId,
      categoryId,
      title,
      statusId: openStatus.id,
      description,
      referencePoint,
      address,
      latitude,
      longitude,

      participants: {
        create: {
          employeeId,
          role: "OWNER",
        },
      },

      images: mediaItems?.length
        ? {
            create: mediaItems.map((item: any) => ({
              imageUrl: item.imageUrl,
              publicId: item.publicId,
              resourceType: item.resourceType || "image",
            })),
          }
        : undefined,
    },
    include: reportInclude,
  });

  io.emit("report-created");
  io.emit("reports-updated");

  return res.status(201).json(report);
});

router.patch("/reports/:id", async (req, res) => {
  const id = Number(req.params.id);

  const {
    categoryId,
    title,
    description,
    referencePoint,
    latitude,
    longitude,
    address,
  } = req.body;

  const report = await prisma.report.update({
    where: {
      id,
    },
    data: {
      categoryId: categoryId ? Number(categoryId) : undefined,
      title,
      description,
      referencePoint,
      latitude,
      longitude,
      address,
    },
    include: reportInclude,
  });

  io.emit("report-updated");
  io.emit("reports-updated");
  return res.json(report);
});

router.delete("/report-images/:id", async (req, res) => {
  const id = Number(req.params.id);

  const image = await prisma.reportImage.findUnique({
    where: { id },
  });

  if (!image) {
    return res.status(404).json({
      error: "Imagem não encontrada.",
    });
  }

  if (image.publicId) {
    await cloudinary.uploader.destroy(image.publicId, {
      resource_type: image.resourceType || "image",
    });
  }

  await prisma.reportImage.delete({
    where: { id },
  });

  return res.json({
    message: "Imagem removida com sucesso.",
  });
});

router.post("/reports/:id/images", async (req, res) => {
  const reportId = Number(req.params.id);
  const { mediaItems } = req.body;

  if (!mediaItems || mediaItems.length === 0) {
    return res.status(400).json({
      error: "Nenhuma imagem enviada.",
    });
  }

  await prisma.reportImage.createMany({
    data: mediaItems.map((item: any) => ({
      reportId,
      imageUrl: item.imageUrl,
      publicId: item.publicId,
      resourceType: item.resourceType || "image",
    })),
  });

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: reportInclude,
  });

  return res.status(201).json(report);
});

router.post("/employee-login", async (req, res) => {
  const { registrationNumber, cpf } = req.body;

  if (!registrationNumber || !cpf) {
    return res.status(400).json({
      error: "Matrícula e CPF são obrigatórios.",
    });
  }

  const cleanCpf = String(cpf).replace(/\D/g, "");

  const employees = await prisma.employee.findMany({
    where: {
      registrationNumber,
    },
  });

  const employee = employees.find(
    (emp) => emp.cpf.replace(/\D/g, "") === cleanCpf
  );

  if (!employee) {
    return res.status(404).json({
      error: "Matrícula ou CPF inválidos.",
    });
  }

  return res.json({
    message: "Login realizado com sucesso.",
    employee,
  });
});

router.get("/employees/:employeeId/reports", async (req, res) => {
  const employeeId = Number(req.params.employeeId);

  const reports = await prisma.report.findMany({
    where: {
      employeeId,
    },
    include: reportInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.json(reports);
});

router.patch("/reports/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const { statusId } = req.body;

  const report = await prisma.report.update({
    where: {
      id,
    },
    data: {
      statusId,
    },
    include: reportInclude,
  });

  return res.json(report);
});

router.get("/reports/:id/messages", async (req, res) => {
  const reportId = Number(req.params.id);

  const messages = await prisma.reportMessage.findMany({
    where: { reportId },
    include: messageInclude,
    orderBy: { createdAt: "asc" },
  });

  const reads = await prisma.reportMessageRead.findMany({
    where: { reportId },
    select: {
      employeeId: true,
      lastReadMessageId: true,
    },
  });

  const messagesWithReads = messages.map((message) => ({
    ...message,
    readByEmployeeIds: reads
      .filter(
        (read) =>
          read.lastReadMessageId &&
          read.lastReadMessageId >= message.id
      )
      .map((read) => read.employeeId),
  }));

  return res.json(messagesWithReads);
});

router.post("/reports/:id/messages", async (req, res) => {
  const reportId = Number(req.params.id);

  const {
  senderId,
  senderName,
  senderRole,
  message,
  replyToMessageId,
  mediaItems,
} = req.body;

  if ((!message || !message.trim()) && (!mediaItems || mediaItems.length === 0)) {
  return res.status(400).json({
    error: "Mensagem ou mídia é obrigatória.",
  });
}

  const newMessage = await prisma.reportMessage.create({
    data: {
  reportId,
  senderId: senderId ? Number(senderId) : undefined,
  senderName,
  senderRole,
  message: message?.trim() || "",
  replyToMessageId: replyToMessageId ? Number(replyToMessageId) : null,

  media: mediaItems?.length
    ? {
        create: mediaItems.map((item: any) => ({
          mediaUrl: item.imageUrl,
          publicId: item.publicId,
          resourceType: item.resourceType || "image",
        })),
      }
    : undefined,
},
    include: messageInclude,
  });
  io.to(`report-${reportId}`).emit("new-message", newMessage);
  return res.status(201).json(newMessage);
});

router.patch("/reports/:reportId/messages/:messageId", async (req, res) => {
  const reportId = Number(req.params.reportId);
  const messageId = Number(req.params.messageId);
  const { senderId, message } = req.body;

  if (!senderId) {
    return res.status(400).json({
      error: "Funcionário é obrigatório.",
    });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({
      error: "Mensagem é obrigatória.",
    });
  }

  const existingMessage = await prisma.reportMessage.findFirst({
    where: {
      id: messageId,
      reportId,
    },
  });

  if (!existingMessage) {
    return res.status(404).json({
      error: "Mensagem não encontrada.",
    });
  }

  if (existingMessage.senderId !== Number(senderId)) {
    return res.status(403).json({
      error: "Você só pode editar suas próprias mensagens.",
    });
  }

  const updatedMessage = await prisma.reportMessage.update({
    where: {
      id: messageId,
    },
    data: {
      message,
    },
    include: messageInclude,
  });

  return res.json(updatedMessage);
});

router.delete("/reports/:reportId/messages/:messageId", async (req, res) => {
  const reportId = Number(req.params.reportId);
  const messageId = Number(req.params.messageId);
  const { senderId } = req.body;

  if (!senderId) {
    return res.status(400).json({
      error: "Funcionário é obrigatório.",
    });
  }
  

  const message = await prisma.reportMessage.findFirst({
    where: {
      id: messageId,
      reportId,
    },
  });

  if (!message) {
    return res.status(404).json({
      error: "Mensagem não encontrada.",
    });
  }

  if (message.senderId !== Number(senderId)) {
    return res.status(403).json({
      error: "Você só pode apagar suas próprias mensagens.",
    });
  }

  const medias = await prisma.reportMessageMedia.findMany({
  where: {
    messageId,
  },
});

for (const media of medias) {
  if (media.publicId) {
    await cloudinary.uploader.destroy(media.publicId, {
      resource_type: media.resourceType || "image",
    });
  }
}

await prisma.reportMessageMedia.deleteMany({
  where: {
    messageId,
  },
});

await prisma.reportMessage.delete({
  where: {
    id: messageId,
  },
});

  return res.json({
    message: "Mensagem apagada com sucesso.",
  });
});

router.get("/reports/:id/unread-count/:employeeId", async (req, res) => {
  const reportId = Number(req.params.id);
  const employeeId = Number(req.params.employeeId);

  const read = await prisma.reportMessageRead.findUnique({
    where: {
      reportId_employeeId: {
        reportId,
        employeeId,
      },
    },
  });

  const unreadCount = await prisma.reportMessage.count({
    where: {
      reportId,
      senderId: {
        not: employeeId,
      },
      ...(read?.lastReadMessageId
        ? {
            id: {
              gt: read.lastReadMessageId,
            },
          }
        : {}),
    },
  });

  return res.json({
    unreadCount,
  });
});

router.post("/reports/:id/mark-read", async (req, res) => {
  const reportId = Number(req.params.id);
  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({
      error: "Funcionário é obrigatório.",
    });
  }

  const lastMessage = await prisma.reportMessage.findFirst({
    where: {
      reportId,
    },
    orderBy: {
      id: "desc",
    },
  });

  await prisma.reportMessageRead.upsert({
    where: {
      reportId_employeeId: {
        reportId,
        employeeId: Number(employeeId),
      },
    },
    update: {
      lastReadMessageId: lastMessage?.id || null,
    },
    create: {
      reportId,
      employeeId: Number(employeeId),
      lastReadMessageId: lastMessage?.id || null,
    },
  });
  io.to(`report-${reportId}`).emit("messages-read", {
  reportId,
  employeeId: Number(employeeId),
  lastReadMessageId: lastMessage?.id || null,
});
  return res.json({
    message: "Conversa marcada como lida.",
  });
});

const typingUsersByReport = new Map<
  number,
  { employeeId: number; employeeName: string; timestamp: number }[]
>();

router.post("/reports/:id/typing", (req, res) => {
  const reportId = Number(req.params.id);
  const { employeeId, employeeName } = req.body;

  if (!employeeId || !employeeName) {
    return res.status(400).json({
      error: "Funcionário é obrigatório.",
    });
  }

  const now = Date.now();

  const current = typingUsersByReport.get(reportId) || [];

  const withoutUser = current.filter(
    (user) => user.employeeId !== Number(employeeId)
  );

  typingUsersByReport.set(reportId, [
    ...withoutUser,
    {
      employeeId: Number(employeeId),
      employeeName,
      timestamp: now,
    },
  ]);

  return res.json({
    message: "Digitando atualizado.",
  });
});

router.get("/reports/:id/typing", (req, res) => {
  const reportId = Number(req.params.id);
  const employeeId = Number(req.query.employeeId);

  const now = Date.now();

  const current = typingUsersByReport.get(reportId) || [];

  const activeUsers = current.filter(
    (user) =>
      now - user.timestamp < 4000 &&
      user.employeeId !== employeeId
  );

  typingUsersByReport.set(reportId, activeUsers);

  return res.json({
    typingUsers: activeUsers,
  });
});

export { router };