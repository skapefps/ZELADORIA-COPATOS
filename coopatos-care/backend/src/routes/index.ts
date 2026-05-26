import { Router } from "express";
import { io } from "../server.js";
import { prisma } from "../prisma/client.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { brandPreset } from "../config/brand.js";

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

const createNotification = async ({
  recipientId,
  actorId,
  type,
  title,
  body,
  reportId,
  messageId,
  privateConversationId,
  privateMessageId,
}: {
  recipientId: number;
  actorId?: number | null;
  type: string;
  title: string;
  body?: string | null;
  reportId?: number | null;
  messageId?: number | null;
  privateConversationId?: number | null;
  privateMessageId?: number | null;
}) => {
  const shouldConsolidatePrivateMessage =
    type === "PRIVATE_MESSAGE" && privateConversationId;

  const existingNotification = shouldConsolidatePrivateMessage
    ? await prisma.notification.findFirst({
      where: {
        recipientId,
        actorId: actorId || null,
        type,
        privateConversationId,
        readAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    : null;

  const notification = existingNotification
    ? await prisma.notification.update({
      where: {
        id: existingNotification.id,
      },
      data: {
        title,
        body: body || null,
        privateMessageId: privateMessageId || null,
        createdAt: new Date(),
      },
    })
    : await prisma.notification.create({
      data: {
        recipientId,
        actorId: actorId || null,
        type,
        title,
        body: body || null,
        reportId: reportId || null,
        messageId: messageId || null,
        privateConversationId: privateConversationId || null,
        privateMessageId: privateMessageId || null,
      },
    });

  const notificationWithContext = await prisma.notification.findUnique({
    where: {
      id: notification.id,
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          department: true,
        },
      },
      privateConversation: {
        include: {
          participants: {
            include: {
              employee: true,
            },
          },
        },
      },
    },
  });

  io.to(`employee-${recipientId}`).emit(
    "notification-created",
    notificationWithContext || notification
  );

  return notificationWithContext || notification;
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
      subject: `Recuperação de matrícula - ${brandPreset.appName}`,
      html: `
        <div style="font-family: Arial, sans-serif; background:${brandPreset.colors.emailBackground}; padding:28px;">
          <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e5e7eb;">
            
            <div style="background:${brandPreset.colors.primary}; padding:24px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:22px;">
                ${brandPreset.appName}
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
                Recebemos uma solicitação para recuperar sua matrícula de acesso ao sistema ${brandPreset.appName}.
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
                  <span style="font-size:18px; color:${brandPreset.colors.primary}; font-weight:700;">
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
                src="${brandPreset.logoUrl}"
                alt="${brandPreset.organizationName}"
                style="max-width:130px; margin-bottom:8px;"
              />

              <p style="font-size:12px; color:#6b7280; margin:0;">
                ${brandPreset.organizationName} - ${brandPreset.tagline}
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

router.get("/employee-session/:id", async (req, res) => {
  try {
    const employeeId = Number(req.params.id);

    const employee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
      select: {
        activeSessionToken: true,
      },
    });

    return res.json({
      activeSessionToken:
        employee?.activeSessionToken || null,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao verificar sessão.",
    });
  }
});


router.get("/", (req, res) => {
  return res.json({
    message: "API funcionando",
  });
});

router.get("/notifications/:employeeId", async (req, res) => {
  try {
    const employeeId = Number(req.params.employeeId);

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: employeeId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
        report: {
          include: {
            category: true,
            status: true,
          },
        },
        message: true,
        privateMessage: true,
        privateConversation: {
          include: {
            participants: {
              include: {
                employee: true,
              },
            },
          },
        },
      },
    });

    return res.json(notifications);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao carregar notificações.",
    });
  }
});

router.post("/notifications/:id/read", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const notification = await prisma.notification.update({
      where: {
        id,
      },
      data: {
        readAt: new Date(),
      },
    });

    return res.json(notification);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao marcar notificação como lida.",
    });
  }
});

router.post("/notifications/:employeeId/read-all", async (req, res) => {
  try {
    const employeeId = Number(req.params.employeeId);

    await prisma.notification.updateMany({
      where: {
        recipientId: employeeId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return res.json({
      message: "Notificações marcadas como lidas.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao marcar notificações como lidas.",
    });
  }
});

router.delete("/notifications/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.notification.delete({
      where: {
        id,
      },
    });

    return res.json({
      message: "Notificação excluída.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao excluir notificação.",
    });
  }
});

router.get("/employees/team", async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao carregar equipe.",
    });
  }
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

router.get("/admin/employees", async (_req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        registrationNumber: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        department: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reports: true,
            participations: true,
          },
        },
      },
    });

    return res.json(employees);
  } catch (error) {
    console.error("Erro ao listar funcionários:", error);
    return res.status(500).json({
      error: "Erro ao listar funcionários.",
    });
  }
});

router.post("/admin/employees", async (req, res) => {
  try {
    const {
      registrationNumber,
      name,
      email,
      cpf,
      phone,
      department,
    } = req.body;

    if (!registrationNumber || !name || !cpf) {
      return res.status(400).json({
        error: "Matrícula, nome e CPF são obrigatórios.",
      });
    }

    const employee = await prisma.employee.create({
      data: {
        registrationNumber: String(registrationNumber).trim(),
        name: String(name).trim(),
        email: email ? String(email).trim().toLowerCase() : null,
        cpf: String(cpf).replace(/\D/g, ""),
        phone: phone ? String(phone).trim() : null,
        department: department ? String(department).trim() : null,
      },
      select: {
        id: true,
        registrationNumber: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        department: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reports: true,
            participations: true,
          },
        },
      },
    });

    return res.status(201).json(employee);
  } catch (error: any) {
    console.error("Erro ao criar funcionário:", error);
    return res.status(500).json({
      error:
        error?.code === "P2002"
          ? "Matrícula ou CPF já cadastrado."
          : "Erro ao criar funcionário.",
    });
  }
});

router.patch("/admin/employees/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      registrationNumber,
      name,
      email,
      cpf,
      phone,
      department,
    } = req.body;

    if (!registrationNumber || !name || !cpf) {
      return res.status(400).json({
        error: "Matrícula, nome e CPF são obrigatórios.",
      });
    }

    const employee = await prisma.employee.update({
      where: {
        id,
      },
      data: {
        registrationNumber: String(registrationNumber).trim(),
        name: String(name).trim(),
        email: email ? String(email).trim().toLowerCase() : null,
        cpf: String(cpf).replace(/\D/g, ""),
        phone: phone ? String(phone).trim() : null,
        department: department ? String(department).trim() : null,
      },
      select: {
        id: true,
        registrationNumber: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        department: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reports: true,
            participations: true,
          },
        },
      },
    });

    return res.json(employee);
  } catch (error: any) {
    console.error("Erro ao atualizar funcionário:", error);
    return res.status(500).json({
      error:
        error?.code === "P2002"
          ? "Matrícula ou CPF já cadastrado."
          : "Erro ao atualizar funcionário.",
    });
  }
});

router.patch("/admin/employees/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { active } = req.body;

    const employee = await prisma.employee.update({
      where: {
        id,
      },
      data: {
        deletedAt: active ? null : new Date(),
        activeSessionToken: active ? undefined : null,
      },
      select: {
        id: true,
        registrationNumber: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        department: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reports: true,
            participations: true,
          },
        },
      },
    });

    if (!active) {
      io.to(`employee-${id}`).emit("force-logout", {
        reason: "Seu cadastro foi desativado pelo administrador.",
      });
    }

    return res.json(employee);
  } catch (error) {
    console.error("Erro ao alterar status do funcionário:", error);
    return res.status(500).json({
      error: "Erro ao alterar status do funcionário.",
    });
  }
});

router.get("/reports/:id/notes", async (req, res) => {
  try {
    const reportId = Number(req.params.id);

    const notes = await prisma.reportNote.findMany({
      where: {
        reportId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
        media: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(notes);
  } catch (error) {
    console.error("Erro ao carregar anotações com mídia:", error);

    try {
      const reportId = Number(req.params.id);

      const notes = await prisma.reportNote.findMany({
        where: {
          reportId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              department: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json(notes.map((note) => ({ ...note, media: [] })));
    } catch (fallbackError) {
      console.error("Erro ao carregar anotações sem mídia:", fallbackError);

      return res.status(500).json({
        error: "Erro ao carregar anotações.",
        detail:
          fallbackError instanceof Error
            ? fallbackError.message
            : "Erro desconhecido.",
      });
    }
  }
});

router.post("/reports/:id/notes", async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    const { authorId, content, mediaItems } = req.body;

    const normalizedMediaItems = Array.isArray(mediaItems)
      ? mediaItems.filter((item: any) => item?.imageUrl)
      : [];
    const normalizedContent = String(content || "").trim();

    if (!authorId || (!normalizedContent && normalizedMediaItems.length === 0)) {
      return res.status(400).json({
        error: "Autor e anotação são obrigatórios.",
      });
    }

    const note = await prisma.reportNote.create({
      data: {
        reportId,
        authorId: Number(authorId),
        content: normalizedContent,
        media: normalizedMediaItems.length
          ? {
            create: normalizedMediaItems.map((item: any) => ({
              mediaUrl: item.imageUrl,
              publicId: item.publicId,
              resourceType: item.resourceType || "image",
            })),
          }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
        media: true,
      },
    });

    io.emit("reports-updated");

    return res.status(201).json(note);
  } catch (error) {
    console.error("Erro ao salvar anotação:", error);
    return res.status(500).json({
      error: "Erro ao salvar anotação.",
      detail:
        error instanceof Error
          ? error.message
          : "Erro desconhecido.",
    });
  }
});

router.delete("/reports/:reportId/notes/:noteId", async (req, res) => {
  try {
    const reportId = Number(req.params.reportId);
    const noteId = Number(req.params.noteId);
    const { authorId } = req.body;

    if (!authorId) {
      return res.status(400).json({
        error: "Autor é obrigatório.",
      });
    }

    const note = await prisma.reportNote.findFirst({
      where: {
        id: noteId,
        reportId,
      },
      include: {
        media: true,
      },
    });

    if (!note) {
      return res.status(404).json({
        error: "Anotação não encontrada.",
      });
    }

    if (note.authorId !== Number(authorId)) {
      return res.status(403).json({
        error: "Você só pode excluir suas próprias anotações.",
      });
    }

    for (const media of note.media) {
      if (media.publicId) {
        await cloudinary.uploader.destroy(media.publicId, {
          resource_type: media.resourceType === "video" ? "video" : "image",
        });
      }
    }

    await prisma.reportNoteMedia.deleteMany({
      where: {
        noteId,
      },
    });

    await prisma.reportNote.delete({
      where: {
        id: noteId,
      },
    });

    io.emit("reports-updated");

    return res.json({
      message: "Anotação excluída.",
    });
  } catch (error) {
    console.error("Erro ao excluir anotação:", error);
    return res.status(500).json({
      error: "Erro ao excluir anotação.",
      detail:
        error instanceof Error
          ? error.message
          : "Erro desconhecido.",
    });
  }
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

  await createNotification({
    recipientId: participant.employeeId,
    actorId: null,
    type: "PARTICIPANT_ADDED",
    title: "Você foi adicionado a um chamado",
    body: `Você foi adicionado ao chamado #${reportId}.`,
    reportId,
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

    await createNotification({
      recipientId: participant.employeeId,
      actorId: employeeId ? Number(employeeId) : null,
      type: "PARTICIPANT_REMOVED",
      title: "Você foi removido de um chamado",
      body: `Você foi removido do chamado #${reportId}.`,
      reportId,
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
  try {
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
      try {
        await cloudinary.uploader.destroy(image.publicId, {
          resource_type:
            image.resourceType === "video" || image.resourceType === "audio"
              ? "video"
              : "image",
        });
      } catch (cloudinaryError) {
        console.error("Erro ao remover mídia do Cloudinary:", cloudinaryError);
      }
    }

    await prisma.reportImage.delete({
      where: { id },
    });

    io.emit("reports-updated");

    return res.json({
      message: "Imagem removida com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao remover imagem:", error);

    return res.status(500).json({
      error: "Erro ao remover imagem.",
    });
  }
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

router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "E-mail e senha são obrigatórios.",
      });
    }

    const login = String(email).trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        role: "ADMIN",
        OR: [
          {
            email: login,
          },
          {
            employee: {
              registrationNumber: login,
            },
          },
        ],
      },
      include: {
        employee: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Credenciais inválidas.",
      });
    }

    const passwordIsValid = await bcrypt.compare(
      String(password),
      user.passwordHash
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        error: "Credenciais inválidas.",
      });
    }

    const adminSessionToken = crypto.randomUUID();

    return res.json({
      message: "Login administrativo realizado com sucesso.",
      admin: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee,
      },
      adminSessionToken,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao fazer login administrativo.",
    });
  }
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

  const sessionToken = crypto.randomUUID();

  const updatedEmployee = await prisma.employee.update({
    where: {
      id: employee.id,
    },
    data: {
      activeSessionToken: sessionToken,
    },
  });

  io.to(`employee-${employee.id}`).emit("force-logout", {
    reason: "Sua conta foi acessada em outro dispositivo ou guia.",
    sessionToken,
  });

  return res.json({
    message: "Login realizado com sucesso.",
    employee: updatedEmployee,
    sessionToken,
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
  const { statusId, actorId } = req.body;

  const report = await prisma.report.update({
    where: {
      id,
    },
    data: {
      statusId,
    },
    include: reportInclude,
  });

  const participants = report.participants || [];

  for (const participant of participants) {
    if (participant.employeeId === Number(actorId)) continue;

    await createNotification({
      recipientId: participant.employeeId,
      actorId: actorId ? Number(actorId) : null,
      type: "REPORT_STATUS_CHANGED",
      title: "Status do chamado alterado",
      body: `O chamado #${report.id} mudou para ${report.status.name}.`,
      reportId: report.id,
    });
  }

  io.emit("report-updated");
  io.emit("reports-updated");

  return res.json(report);
});

router.get("/media-proxy", async (req, res) => {
  try {
    let url = String(req.query.url || "");

    if (!url || !url.startsWith("https://res.cloudinary.com/")) {
      return res.status(400).json({ error: "URL inválida." });
    }

    const range = req.headers.range;

    const headers: Record<string, string> = {};

    if (range) {
      headers.Range = range;
    }

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok && response.status !== 206) {
      return res.status(502).json({ error: "Erro ao carregar mídia." });
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    const contentLength = response.headers.get("content-length");
    const contentRange = response.headers.get("content-range");
    const acceptRanges = response.headers.get("accept-ranges");

    res.status(response.status);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000");

    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    if (contentRange) {
      res.setHeader("Content-Range", contentRange);
    }

    if (acceptRanges) {
      res.setHeader("Accept-Ranges", acceptRanges);
    } else {
      res.setHeader("Accept-Ranges", "bytes");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return res.send(buffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro no proxy da mídia." });
  }
});

router.post("/private-conversations", async (req, res) => {
  try {
    const { employeeId, otherEmployeeId } = req.body;

    if (!employeeId || !otherEmployeeId) {
      return res.status(400).json({
        error: "Funcionários são obrigatórios.",
      });
    }

    const employeeA = Number(employeeId);
    const employeeB = Number(otherEmployeeId);

    if (employeeA === employeeB) {
      return res.status(400).json({
        error: "Não é possível conversar consigo mesmo.",
      });
    }

    const existing = await prisma.privateConversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                employeeId: employeeA,
              },
            },
          },
          {
            participants: {
              some: {
                employeeId: employeeB,
              },
            },
          },
        ],
      },
      include: {
        participants: {
          include: {
            employee: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (existing) {
      return res.json(existing);
    }

    const conversation = await prisma.privateConversation.create({
      data: {
        participants: {
          create: [
            {
              employeeId: employeeA,
            },
            {
              employeeId: employeeB,
            },
          ],
        },
      },
      include: {
        participants: {
          include: {
            employee: true,
          },
        },
        messages: true,
      },
    });

    return res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao criar conversa privada.",
    });
  }
});

router.get("/private-conversations/:employeeId", async (req, res) => {
  try {
    const employeeId = Number(req.params.employeeId);

    const conversations = await prisma.privateConversation.findMany({
      where: {
        participants: {
          some: {
            employeeId,
          },
        },
      },
      include: {
        participants: {
          include: {
            employee: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.json(conversations);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao carregar conversas privadas.",
    });
  }
});

router.get("/private-conversations/:conversationId/messages", async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);

    const messages = await prisma.privateMessage.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
        media: true,
        replyToMessage: {
          select: {
            id: true,
            message: true,
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.json(messages);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao carregar mensagens privadas.",
    });
  }
});

router.post("/private-conversations/:conversationId/messages", async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const {
      senderId,
      message,
      mediaItems,
      replyToMessageId,
      mentionedEmployeeIds,
    } = req.body;

    if (!senderId) {
      return res.status(400).json({
        error: "Funcionário é obrigatório.",
      });
    }

    if ((!message || !message.trim()) && (!mediaItems || mediaItems.length === 0)) {
      return res.status(400).json({
        error: "Mensagem ou mídia é obrigatória.",
      });
    }

    const conversation = await prisma.privateConversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        error: "Conversa não encontrada.",
      });
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.employeeId === Number(senderId)
    );

    if (!isParticipant) {
      return res.status(403).json({
        error: "Você não participa dessa conversa.",
      });
    }

    const newMessage = await prisma.privateMessage.create({
      data: {
        conversationId,
        senderId: Number(senderId),
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
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
        media: true,
        replyToMessage: {
          select: {
            id: true,
            message: true,
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    await prisma.privateConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    const recipients = conversation.participants.filter(
      (participant) => participant.employeeId !== Number(senderId)
    );

    const mentionedIds = Array.isArray(mentionedEmployeeIds)
      ? mentionedEmployeeIds.map((id) => Number(id))
      : [];

    for (const recipient of recipients) {
      const wasMentioned = mentionedIds.includes(recipient.employeeId);

      await createNotification({
        recipientId: recipient.employeeId,
        actorId: Number(senderId),
        type: wasMentioned ? "PRIVATE_MENTION" : "PRIVATE_MESSAGE",
        title: wasMentioned
          ? "Você foi mencionado em uma conversa privada"
          : "Nova mensagem privada",
        body: wasMentioned
          ? `${newMessage.sender.name} mencionou você em uma conversa privada.`
          : `${newMessage.sender.name} enviou uma mensagem para você.`,
        privateConversationId: conversationId,
        privateMessageId: newMessage.id,
      });

      io.to(`employee-${recipient.employeeId}`).emit(
        "private-message",
        newMessage
      );
    }

    io.to(`private-conversation-${conversationId}`).emit(
      "private-message",
      newMessage
    );

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao enviar mensagem privada.",
    });
  }
});

router.patch("/private-conversations/:conversationId/messages/:messageId", async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const messageId = Number(req.params.messageId);
    const { senderId, message } = req.body;

    if (!senderId || !message?.trim()) {
      return res.status(400).json({ error: "Dados inválidos." });
    }

    const existingMessage = await prisma.privateMessage.findFirst({
      where: { id: messageId, conversationId },
    });

    if (!existingMessage) {
      return res.status(404).json({ error: "Mensagem não encontrada." });
    }

    if (existingMessage.senderId !== Number(senderId)) {
      return res.status(403).json({
        error: "Você só pode editar suas próprias mensagens.",
      });
    }

    const updatedMessage = await prisma.privateMessage.update({
      where: { id: messageId },
      data: { message: message.trim() },
      include: {
        sender: {
          select: { id: true, name: true, department: true },
        },
        media: true,
      },
    });

    io.to(`private-conversation-${conversationId}`).emit(
      "private-message-updated",
      updatedMessage
    );

    return res.json(updatedMessage);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao editar mensagem privada.",
    });
  }
});

router.delete("/private-conversations/:conversationId/messages/:messageId", async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const messageId = Number(req.params.messageId);
    const { senderId } = req.body;

    const existingMessage = await prisma.privateMessage.findFirst({
      where: { id: messageId, conversationId },
    });

    if (!existingMessage) {
      return res.status(404).json({ error: "Mensagem não encontrada." });
    }

    if (existingMessage.senderId !== Number(senderId)) {
      return res.status(403).json({
        error: "Você só pode apagar suas próprias mensagens.",
      });
    }

    const medias = await prisma.privateMessageMedia.findMany({
      where: { messageId },
    });

    for (const media of medias) {
      if (media.publicId) {
        await cloudinary.uploader.destroy(media.publicId, {
          resource_type:
            media.resourceType === "audio"
              ? "video"
              : media.resourceType || "image",
        });
      }
    }

    await prisma.privateMessageMedia.deleteMany({
      where: { messageId },
    });

    await prisma.privateMessage.delete({
      where: { id: messageId },
    });

    io.to(`private-conversation-${conversationId}`).emit(
      "private-message-deleted",
      { conversationId, messageId }
    );

    return res.json({ message: "Mensagem apagada com sucesso." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao apagar mensagem privada.",
    });
  }
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
    mentionedEmployeeIds,
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

  const report = await prisma.report.findUnique({
    where: {
      id: reportId,
    },
    include: {
      participants: true,
    },
  });

  const mentionedIds = Array.isArray(mentionedEmployeeIds)
    ? mentionedEmployeeIds.map((id) => Number(id))
    : [];

  if (mentionedIds.length > 0) {
    await prisma.reportMessageMention.createMany({
      data: mentionedIds.map((employeeId) => ({
        messageId: newMessage.id,
        employeeId,
      })),
      skipDuplicates: true,
    });
  }

  const participants = report?.participants || [];

  for (const participant of participants) {
    if (participant.employeeId === Number(senderId)) continue;

    const wasMentioned = mentionedIds.includes(participant.employeeId);

    await createNotification({
      recipientId: participant.employeeId,
      actorId: senderId ? Number(senderId) : null,
      type: wasMentioned ? "MENTION" : "REPORT_MESSAGE",
      title: wasMentioned
        ? "Você foi mencionado em uma conversa"
        : "Nova mensagem em um chamado",
      body: wasMentioned
        ? `${senderName} mencionou você no chamado #${reportId}.`
        : `${senderName} enviou uma mensagem no chamado #${reportId}.`,
      reportId,
      messageId: newMessage.id,
    });
  }

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
        resource_type: media.resourceType === "audio" ? "video" : media.resourceType || "image",
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

const typingUsersByPrivateConversation = new Map<
  number,
  { employeeId: number; employeeName: string; timestamp: number }[]
>();


router.post("/private-conversations/:id/typing", (req, res) => {
  const conversationId = Number(req.params.id);
  const { employeeId, employeeName } = req.body;

  if (!employeeId || !employeeName) {
    return res.status(400).json({
      error: "Funcionário é obrigatório.",
    });
  }

  const now = Date.now();

  const current =
    typingUsersByPrivateConversation.get(conversationId) || [];

  const withoutUser = current.filter(
    (user) => user.employeeId !== Number(employeeId)
  );

  typingUsersByPrivateConversation.set(conversationId, [
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

router.get("/private-conversations/:id/typing", (req, res) => {
  const conversationId = Number(req.params.id);
  const employeeId = Number(req.query.employeeId);

  const now = Date.now();

  const current =
    typingUsersByPrivateConversation.get(conversationId) || [];

  const activeUsers = current.filter(
    (user) =>
      now - user.timestamp < 4000 &&
      user.employeeId !== employeeId
  );

  typingUsersByPrivateConversation.set(conversationId, activeUsers);

  return res.json({
    typingUsers: activeUsers,
  });
});


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
