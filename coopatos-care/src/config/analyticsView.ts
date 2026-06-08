export type AnalyticsViewSection =
  | "summary"
  | "secondary"
  | "monthly"
  | "status"
  | "backlog"
  | "efficiency"
  | "employees"
  | "departments"
  | "categories"
  | "priority"
  | "locations";

export const analyticsViewOptions: {
  id: AnalyticsViewSection;
  label: string;
  description: string;
  group: "Cards" | "Graficos" | "Listas";
}[] = [
  {
    id: "summary",
    label: "Cards principais",
    description: "Totais, concluídos, pendentes e críticos.",
    group: "Cards",
  },
  {
    id: "secondary",
    label: "Cards operacionais",
    description: "Risco alto, sem responsável e abertos na semana.",
    group: "Cards",
  },
  {
    id: "monthly",
    label: "Evolução mensal",
    description: "Linha de abertos e finalizados por mês.",
    group: "Graficos",
  },
  {
    id: "status",
    label: "Distribuição por status",
    description: "Pizza do percentual operacional atual.",
    group: "Graficos",
  },
  {
    id: "backlog",
    label: "Backlog por status",
    description: "Concentração dos chamados não finalizados.",
    group: "Graficos",
  },
  {
    id: "efficiency",
    label: "Eficiência por pessoa",
    description: "Percentual finalizado por funcionário.",
    group: "Graficos",
  },
  {
    id: "employees",
    label: "Produção individual",
    description: "Ranking de pessoas envolvidas.",
    group: "Graficos",
  },
  {
    id: "departments",
    label: "Produção por departamento",
    description: "Volume e conclusão por equipe.",
    group: "Graficos",
  },
  {
    id: "categories",
    label: "Categorias",
    description: "Categorias com mais demanda.",
    group: "Listas",
  },
  {
    id: "priority",
    label: "Prioridades",
    description: "Distribuição por prioridade.",
    group: "Listas",
  },
  {
    id: "locations",
    label: "Locais recorrentes",
    description: "Endereços ou pontos mais repetidos.",
    group: "Listas",
  },
];

const validAnalyticsViewSections = new Set(
  analyticsViewOptions.map((option) => option.id)
);

export const getDefaultAnalyticsView = () =>
  analyticsViewOptions.map((option) => option.id);

export const normalizeAnalyticsView = (sections: string[]) => {
  const normalized = sections.filter((section): section is AnalyticsViewSection =>
    validAnalyticsViewSections.has(section as AnalyticsViewSection)
  );

  return normalized.length ? normalized : getDefaultAnalyticsView();
};
