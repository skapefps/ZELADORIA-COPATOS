INSERT INTO "Department" ("name", "description", "color", "active", "updatedAt") VALUES
  ('Administrativo', 'Gestão administrativa, usuários e acompanhamento geral.', '#7c3aed', true, CURRENT_TIMESTAMP),
  ('Zeladoria', 'Equipe responsável por rotinas de zeladoria e conservação.', '#2563eb', true, CURRENT_TIMESTAMP),
  ('Manutenção', 'Manutenções corretivas e preventivas estruturais.', '#f97316', true, CURRENT_TIMESTAMP),
  ('Elétrica', 'Chamados e rotinas de instalações elétricas.', '#f59e0b', true, CURRENT_TIMESTAMP),
  ('Segurança', 'Acompanhamento de segurança patrimonial e riscos.', '#dc2626', true, CURRENT_TIMESTAMP),
  ('Limpeza', 'Rotinas de limpeza, organização e apoio operacional.', '#0891b2', true, CURRENT_TIMESTAMP),
  ('Operacional', 'Equipe operacional de apoio e execução de campo.', '#16a34a', true, CURRENT_TIMESTAMP),
  ('Financeiro', 'Apoio financeiro e controles administrativos.', '#059669', true, CURRENT_TIMESTAMP),
  ('RH', 'Recursos humanos e apoio aos colaboradores.', '#db2777', true, CURRENT_TIMESTAMP),
  ('TI', 'Suporte de tecnologia e sistemas.', '#0f766e', true, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE SET
  "description" = EXCLUDED."description",
  "color" = EXCLUDED."color",
  "active" = true,
  "deletedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP;
