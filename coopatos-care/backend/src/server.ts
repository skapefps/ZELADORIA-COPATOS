import express from "express";
import cors from "cors";

import { router } from "./routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.json());
app.use(router);

app.listen(3333, () => {
  console.log("Servidor rodando na porta 3333");
});

const PORT = Number(process.env.PORT) || 3333;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
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