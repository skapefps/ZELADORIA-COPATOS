export type Category = "Hídrico" | "Elétrico" | "Erosão" | "Segurança" | "Vegetação" | "Outro";
export type Status = "Aberto" | "Em Andamento" | "Aguardando Peça" | "Concluído";

export const CATEGORY_WEIGHTS: Record<Category, number> = {
  "Hídrico": 5,
  "Elétrico": 4,
  "Erosão": 3,
  "Segurança": 2,
  "Vegetação": 1,
  "Outro": 0,
};

export const CATEGORIES: Category[] = ["Hídrico", "Elétrico", "Erosão", "Segurança", "Vegetação", "Outro"];
export const STATUSES: Status[] = ["Aberto", "Em Andamento", "Aguardando Peça", "Concluído"];

export interface Report {
  id: string;
  matricula: string;
  category: Category;
  status: Status;
  description: string;
  referencePoint: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

const images = [
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1590479773265-7464e5d48118?w=400&h=300&fit=crop",
];

// Coordinates around Patos de Minas, MG area
const locations: { lat: number; lng: number; ref: string }[] = [
  { lat: -18.578, lng: -46.518, ref: "Próximo ao tanque de resfriamento 3" },
  { lat: -18.582, lng: -46.522, ref: "Galpão de armazenamento B" },
  { lat: -18.575, lng: -46.515, ref: "Estrada de acesso principal, km 2" },
  { lat: -18.580, lng: -46.525, ref: "Cerca divisória lote 14" },
  { lat: -18.577, lng: -46.520, ref: "Sala de ordenha mecânica" },
  { lat: -18.584, lng: -46.512, ref: "Poço artesiano setor norte" },
  { lat: -18.579, lng: -46.528, ref: "Subestação de energia" },
  { lat: -18.573, lng: -46.519, ref: "Pátio de carga e descarga" },
  { lat: -18.581, lng: -46.516, ref: "Escritório administrativo" },
  { lat: -18.576, lng: -46.523, ref: "Área de pastagem setor 7" },
  { lat: -18.583, lng: -46.521, ref: "Silo de ração" },
  { lat: -18.574, lng: -46.517, ref: "Plataforma de recepção de leite" },
  { lat: -18.580, lng: -46.514, ref: "Estacionamento de caminhões" },
  { lat: -18.577, lng: -46.526, ref: "Casa de bombas" },
  { lat: -18.585, lng: -46.519, ref: "Laboratório de qualidade" },
];

export const mockReports: Report[] = [
  {
    id: "RPT-001", matricula: "4521", category: "Hídrico", status: "Aberto",
    description: "Vazamento grande na tubulação principal de água que abastece o tanque de resfriamento. Água jorrando com pressão.",
    referencePoint: locations[0].ref, imageUrl: images[0],
    latitude: locations[0].lat, longitude: locations[0].lng,
    createdAt: "2025-04-14T08:30:00", updatedAt: "2025-04-14T08:30:00",
  },
  {
    id: "RPT-002", matricula: "3187", category: "Elétrico", status: "Em Andamento",
    description: "Fiação exposta no painel elétrico do galpão B. Risco de curto-circuito.",
    referencePoint: locations[1].ref, imageUrl: images[1],
    latitude: locations[1].lat, longitude: locations[1].lng,
    createdAt: "2025-04-13T14:15:00", updatedAt: "2025-04-14T09:00:00",
  },
  {
    id: "RPT-003", matricula: "4521", category: "Erosão", status: "Aberto",
    description: "Erosão avançada na estrada de acesso após as últimas chuvas. Dificultando passagem de caminhões.",
    referencePoint: locations[2].ref, imageUrl: images[2],
    latitude: locations[2].lat, longitude: locations[2].lng,
    createdAt: "2025-04-13T10:45:00", updatedAt: "2025-04-13T10:45:00",
  },
  {
    id: "RPT-004", matricula: "2956", category: "Segurança", status: "Aguardando Peça",
    description: "Cerca rompida no lote 14. Animais podem escapar para a rodovia.",
    referencePoint: locations[3].ref, imageUrl: images[3],
    latitude: locations[3].lat, longitude: locations[3].lng,
    createdAt: "2025-04-12T16:20:00", updatedAt: "2025-04-13T11:30:00",
  },
  {
    id: "RPT-005", matricula: "3187", category: "Vegetação", status: "Concluído",
    description: "Mato alto bloqueando a visão da câmera de segurança na entrada.",
    referencePoint: locations[4].ref, imageUrl: images[4],
    latitude: locations[4].lat, longitude: locations[4].lng,
    createdAt: "2025-04-11T09:00:00", updatedAt: "2025-04-12T15:00:00",
  },
  {
    id: "RPT-006", matricula: "5102", category: "Hídrico", status: "Aberto",
    description: "Bomba do poço artesiano fazendo barulho estranho e diminuindo a vazão.",
    referencePoint: locations[5].ref, imageUrl: images[5],
    latitude: locations[5].lat, longitude: locations[5].lng,
    createdAt: "2025-04-14T07:00:00", updatedAt: "2025-04-14T07:00:00",
  },
  {
    id: "RPT-007", matricula: "2956", category: "Elétrico", status: "Aberto",
    description: "Queda de energia constante na subestação. Equipamentos desligando.",
    referencePoint: locations[6].ref, imageUrl: images[6% images.length],
    latitude: locations[6].lat, longitude: locations[6].lng,
    createdAt: "2025-04-14T06:30:00", updatedAt: "2025-04-14T06:30:00",
  },
  {
    id: "RPT-008", matricula: "4521", category: "Erosão", status: "Em Andamento",
    description: "Bueiro entupido causando alagamento no pátio de carga.",
    referencePoint: locations[7].ref, imageUrl: images[2],
    latitude: locations[7].lat, longitude: locations[7].lng,
    createdAt: "2025-04-12T13:00:00", updatedAt: "2025-04-13T08:00:00",
  },
  {
    id: "RPT-009", matricula: "5102", category: "Hídrico", status: "Aberto",
    description: "Goteira no teto do escritório administrativo, danificando documentos.",
    referencePoint: locations[8].ref, imageUrl: images[0],
    latitude: locations[8].lat, longitude: locations[8].lng,
    createdAt: "2025-04-14T10:00:00", updatedAt: "2025-04-14T10:00:00",
  },
  {
    id: "RPT-010", matricula: "3187", category: "Vegetação", status: "Aberto",
    description: "Árvore com risco de queda próximo à cerca do setor de pastagem.",
    referencePoint: locations[9].ref, imageUrl: images[4],
    latitude: locations[9].lat, longitude: locations[9].lng,
    createdAt: "2025-04-13T15:30:00", updatedAt: "2025-04-13T15:30:00",
  },
  {
    id: "RPT-011", matricula: "2956", category: "Segurança", status: "Concluído",
    description: "Extintor de incêndio vencido no silo de ração.",
    referencePoint: locations[10].ref, imageUrl: images[3],
    latitude: locations[10].lat, longitude: locations[10].lng,
    createdAt: "2025-04-10T11:00:00", updatedAt: "2025-04-11T14:00:00",
  },
  {
    id: "RPT-012", matricula: "5102", category: "Elétrico", status: "Aguardando Peça",
    description: "Motor da esteira da plataforma de recepção queimou.",
    referencePoint: locations[11].ref, imageUrl: images[1],
    latitude: locations[11].lat, longitude: locations[11].lng,
    createdAt: "2025-04-11T08:00:00", updatedAt: "2025-04-12T10:00:00",
  },
  {
    id: "RPT-013", matricula: "4521", category: "Hídrico", status: "Em Andamento",
    description: "Cano estourado no banheiro do estacionamento de caminhões.",
    referencePoint: locations[12].ref, imageUrl: images[0],
    latitude: locations[12].lat, longitude: locations[12].lng,
    createdAt: "2025-04-13T07:45:00", updatedAt: "2025-04-13T14:00:00",
  },
  {
    id: "RPT-014", matricula: "3187", category: "Hídrico", status: "Aberto",
    description: "Infiltração na parede da casa de bombas comprometendo a estrutura.",
    referencePoint: locations[13].ref, imageUrl: images[5],
    latitude: locations[13].lat, longitude: locations[13].lng,
    createdAt: "2025-04-14T11:00:00", updatedAt: "2025-04-14T11:00:00",
  },
  {
    id: "RPT-015", matricula: "2956", category: "Segurança", status: "Aberto",
    description: "Iluminação do laboratório com defeito, área ficando escura à noite.",
    referencePoint: locations[14].ref, imageUrl: images[3],
    latitude: locations[14].lat, longitude: locations[14].lng,
    createdAt: "2025-04-14T09:30:00", updatedAt: "2025-04-14T09:30:00",
  },
];

export const getReportsByMatricula = (matricula: string) =>
  mockReports.filter((r) => r.matricula === matricula);

export const getSortedReports = (reports: Report[]) =>
  [...reports].sort((a, b) => {
    const weightDiff = CATEGORY_WEIGHTS[b.category] - CATEGORY_WEIGHTS[a.category];
    if (weightDiff !== 0) return weightDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
