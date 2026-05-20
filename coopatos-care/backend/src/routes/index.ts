import { Router } from "express";
import { prisma } from "../prisma/client.js";
import { v2 as cloudinary } from "cloudinary";

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


router.get("/", (req, res) => {
  return res.json({
    message: "API funcionando",
  });
});

router.get("/employees", async (req, res) => {
  const employees = await prisma.employee.findMany();
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
    include: {
      employee: true,
      category: true,
      status: true,
      images: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.json(reports);
});

router.post("/reports", async (req, res) => {
  const {
  employeeId,
  categoryId,
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
      statusId: openStatus.id,
      description,
      referencePoint,
      address,
      latitude,
      longitude,

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
    include: {
      employee: true,
      category: true,
      status: true,
      images: true,
    },
  });

  return res.status(201).json(report);
});

router.patch("/reports/:id", async (req, res) => {
  const id = Number(req.params.id);

  const {
    categoryId,
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
      description,
      referencePoint,
      latitude,
      longitude,
      address,
    },
    include: {
      employee: true,
      category: true,
      status: true,
      images: true,
    },
  });

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

// ADICIONAR IMAGENS EDITAR

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
    include: {
      employee: true,
      category: true,
      status: true,
      images: true,
    },
  });

  return res.status(201).json(report);
});

//LOGIN FUNCIONARIO 

router.post("/employee-login", async (req, res) => {
  const { registrationNumber } = req.body;

  if (!registrationNumber) {
    return res.status(400).json({
      error: "Matrícula é obrigatória.",
    });
  }

  const employee = await prisma.employee.findUnique({
    where: {
      registrationNumber,
    },
  });

  if (!employee) {
    return res.status(404).json({
      error: "Matrícula não encontrada.",
    });
  }

  return res.json({
    message: "Login realizado com sucesso.",
    employee,
  });
});



 //REPORTS

router.get("/employees/:employeeId/reports", async (req, res) => {
  const employeeId = Number(req.params.employeeId);

  const reports = await prisma.report.findMany({
    where: {
      employeeId,
    },
    include: {
      category: true,
      status: true,
      images: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.json(reports);
});

//ALTERACAO STATUS DO CHAMADO

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
    include: {
      employee: true,
      category: true,
      status: true,
      images: true,
    },
  });

  return res.json(report);
});
export { router };