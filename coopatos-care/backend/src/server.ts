import express from "express";
import cors from "cors";

import { router } from "./routes/index.js";

const app = express();

app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(router);

app.listen(3333, "0.0.0.0", () => {
  console.log("Servidor rodando na porta 3333");
});