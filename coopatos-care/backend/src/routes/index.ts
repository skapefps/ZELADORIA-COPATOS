import { Router } from "express";
import { prisma } from "../prisma/client.js";

const router = Router();

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

export { router };
router.post("/reports", async (req, res) => {
  const {
    employeeId,
    categoryId,
    description,
    referencePoint,
    latitude,
    longitude,
  } = req.body;

  // Buscar o status ABERTO
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
      latitude,
      longitude,
    },
    include: {
      employee: true,
      category: true,
      status: true,
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