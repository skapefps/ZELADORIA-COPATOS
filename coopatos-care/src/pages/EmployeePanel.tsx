import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import {
  Camera,
  MapPin,
  Send,
  List,
  Plus,
  LogOut,
  AlertTriangle,
  Droplets,
  Zap,
  Mountain,
  Expand,
  Shield,
  TreePine,
  HelpCircle,
  ChevronDown,
  Reply,
  Smile,
  MessageCircle,
  Check,
  CheckCheck,
  Search,
  Pencil,
  Filter,
  X,
  Mic,
  Square,
  Trash2,
  Images,
  Bell,
  Users
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// =========================
// Types
// =========================


const MAX_FILE_SIZE = 100 * 1024 * 1024; // TAMANHO maximo do arquivo , atualmente 100mb

type Category = {
  id: number;
  name: string;
  icon?: string | null;
};

type Report = {
  id: number;
  description?: string | null;
  title?: string | null;
  referencePoint?: string | null;
  latitude?: number | null;
  _count?: {
  messages: number;
  
};
  longitude?: number | null;
  address?: string | null;
  createdAt: string;

  category: {
    id: number;
    name: string;
  };

  status: {
    id: number;
    name: string;
    color?: string | null;
  };

  images?: {
  id: number;
  imageUrl: string;
  publicId?: string | null;
  resourceType?: string | null;
}[];
employee: {
  id: number;
  name: string;
};

participants?: {
  id: number;
  role: string;
  employee: {
    id: number;
    name: string;
    department?: string | null;
  };
}[];
};


type ReportMessage = {
  id: number;
  reportId: number;
  readByEmployeeIds?: number[];
  senderId?: number | null;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;

  sender?: {
    id: number;
    name: string;
    department?: string | null;
  } | null;

  replyToMessage?: {
    id: number;
    senderName: string;
    message: string;
  } | null;

  media?: {
    id: number;
    mediaUrl: string;
    publicId?: string | null;
    resourceType?: string | null;
  }[];
};

type EmployeeOption = {
  id: number;
  name: string;
  registrationNumber: string;
  department?: string | null;
};

type AppNotification = {
  id: number;
  recipientId: number;
  actorId?: number | null;
  type: string;
  title: string;
  body?: string | null;
  reportId?: number | null;
  messageId?: number | null;
  readAt?: string | null;
  createdAt: string;
  actor?: {
    id: number;
    name: string;
    department?: string | null;
  } | null;
};

type PrivateConversation = {
  id: number;
  participants: {
    id: number;
    employeeId: number;
    employee: {
      id: number;
      name: string;
      department?: string | null;
    };
  }[];
  messages?: PrivateMessage[];
  createdAt: string;
  updatedAt: string;
  replyToMessageId?: number | null;
};


type PrivateMessage = {
  id: number;
  conversationId: number;
  senderId: number;
  message: string;
  mediaUrl?: string | null;
  publicId?: string | null;
  resourceType?: string | null;
  createdAt: string;
  sender?: {
    id: number;
    name: string;
    department?: string | null;
  };
    media?: {
    id: number;
    mediaUrl: string;
    publicId?: string | null;
    resourceType?: string | null;
  }[];
  replyToMessageId?: number | null;
replyToMessage?: {
  id: number;
  message: string;
  sender?: {
    id: number;
    name: string;
  } | null;
} | null;
};

const categoryIcons: Record<string, React.ReactNode> = {
  "Hídrico": <Droplets className="w-4 h-4 text-blue-500" />,
  "Elétrico": <Zap className="w-4 h-4 text-yellow-500" />,
  "Erosão": <Mountain className="w-4 h-4 text-amber-600" />,
  "Segurança": <Shield className="w-4 h-4 text-red-500" />, "Vegetação": <TreePine className="w-4 h-4 text-green-500" />,
  "Outros": <HelpCircle className="w-4 h-4 text-gray-500" />,
};

const statusColors: Record<string, string> = {
  ABERTO: "bg-red-100 text-red-700 border-red-200",
  EM_ANALISE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  EM_ANDAMENTO: "bg-blue-100 text-blue-700 border-blue-200",
  FINALIZADO: "bg-green-100 text-green-700 border-green-200",
};

const departmentColors: Record<string, string> = {
  Financeiro:
    "bg-emerald-100 text-emerald-800 border-emerald-200",

  Zeladoria:
    "bg-blue-100 text-blue-800 border-blue-200",

  Segurança:
    "bg-red-100 text-red-800 border-red-200",

  Elétrica:
    "bg-amber-100 text-amber-800 border-amber-200",

  Limpeza:
    "bg-cyan-100 text-cyan-800 border-cyan-200",

  Administrativo:
    "bg-violet-100 text-violet-800 border-violet-200",

  RH:
    "bg-pink-100 text-pink-800 border-pink-200",

  Manutenção:
    "bg-orange-100 text-orange-800 border-orange-200",
};



const getDepartmentStyle = (department?: string | null) => {
  if (!department) {
    return "bg-gray-100 text-gray-700 border-gray-200";
  }

  return (
    departmentColors[department] ||
    "bg-gray-100 text-gray-700 border-gray-200"
  );
};

const getCloudinaryAudioPlaybackUrl = (url: string) => {
  if (!url.includes("res.cloudinary.com")) return url;

  let playbackUrl = url;

  if (playbackUrl.includes("/video/upload/")) {
    playbackUrl = playbackUrl.replace("/video/upload/", "/video/upload/f_mp4,vc_none/");
  } else if (playbackUrl.includes("/upload/")) {
    playbackUrl = playbackUrl.replace("/upload/", "/upload/f_mp4,vc_none/");
  }

  playbackUrl = playbackUrl.replace(/\.[a-zA-Z0-9]+($|\?)/, ".mp4$1");

  return playbackUrl;
};

const AudioMessage = ({ url, apiUrl }: { url: string; apiUrl: string }) => {
  const compatibleUrl = getCloudinaryAudioPlaybackUrl(url);
  const audioUrl = `${apiUrl}/media-proxy?url=${encodeURIComponent(compatibleUrl)}`;

  return (
    <audio
      src={audioUrl}
      controls
      preload="metadata"
      playsInline
      className="w-[260px] max-w-full block"
    />
  );
};


const EmployeePanel = () => {
  const employee = JSON.parse(localStorage.getItem("employee") || "{}");
const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3333"
    : import.meta.env.VITE_API_URL || "https://zeladoria-coopatos-api.onrender.com";

  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const touchStartX = useRef(0);
 const tabsOrder: Array<"new" | "history" | "reports"> = [
  "new",
  "history",
  "reports",
];

const tabX = useMotionValue(0);
const tabsContainerRef = useRef<HTMLDivElement | null>(null);
const [tabsContainerWidth, setTabsContainerWidth] = useState(0);
const [isMobileTabs, setIsMobileTabs] = useState(false);
  const [readMessagesByReport, setReadMessagesByReport] = useState<Record<number, number>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [address, setAddress] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutos de inatividade para logout automático
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const previousMessagesLengthRef = useRef(0);
  const sendingMessageRef = useRef(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [editCoords, setEditCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [messageMenuId, setMessageMenuId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReportMessage | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [geocoding, setGeocoding] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [showPrivateChatModal, setShowPrivateChatModal] = useState(false);
  const [privateConversation, setPrivateConversation] =
  useState<PrivateConversation | null>(null);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [privateMessageText, setPrivateMessageText] = useState("");
  const [privateChatFiles, setPrivateChatFiles] = useState<File[]>([]);
  const [privateMessageMenuId, setPrivateMessageMenuId] = useState<number | null>(null);
  const [editingPrivateMessageId, setEditingPrivateMessageId] = useState<number | null>(null);
  const [editingPrivateMessageText, setEditingPrivateMessageText] = useState("");
  const [replyingToPrivateMessage, setReplyingToPrivateMessage] = useState<PrivateMessage | null>(null);
  const privateChatFileInputRef = useRef<HTMLInputElement>(null);
  const privateMessagesContainerRef = useRef<HTMLDivElement | null>(null);
  const privateMessagesEndRef = useRef<HTMLDivElement | null>(null);  
  const [showPrivateEmojiPicker, setShowPrivateEmojiPicker] = useState(false);
  const [isRecordingPrivateAudio, setIsRecordingPrivateAudio] = useState(false);
  const [privateAudioSeconds, setPrivateAudioSeconds] = useState(0);
  const privateMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const privateAudioChunksRef = useRef<Blob[]>([]);
  const privateAudioTimerRef = useRef<number | null>(null);
  const [loadingPrivateMessages, setLoadingPrivateMessages] = useState(false);
  const [privateTypingUsers, setPrivateTypingUsers] = useState<
  { employeeId: number; employeeName: string }[]
>([]);
  const [showPrivateMessageSearch, setShowPrivateMessageSearch] = useState(false);
  const [privateMessageSearchTerm, setPrivateMessageSearchTerm] = useState("");
  const [currentPrivateSearchIndex, setCurrentPrivateSearchIndex] = useState(0);
  const privateMessageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [sendingPrivateMessage, setSendingPrivateMessage] = useState(false);
  const [teamEmployees, setTeamEmployees] = useState<EmployeeOption[]>([]);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamDepartmentFilter, setTeamDepartmentFilter] = useState("all");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const isNearBottomRef = useRef(true);
  const lastMessageIdRef = useRef<number | null>(null);
  const hasOpenedChatRef = useRef(false);
  const messageMenuRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioTimerRef = useRef<number | null>(null);
  const { matricula, logout } = useAuth();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [showChatMediaModal, setShowChatMediaModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [messageSearchTerm, setMessageSearchTerm] = useState("");
  const [onlineEmployeeIds, setOnlineEmployeeIds] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [editReferencePoint, setEditReferencePoint] = useState("");
  const employeeName = employee.name || "";

  const [messages, setMessages] = useState<ReportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ employeeId: number; employeeName: string }[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
 const [expandedMedia, setExpandedMedia] = useState<{
  items: {
    mediaUrl: string;
    resourceType?: string | null;
  }[];
  index: number;
} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"new" | "history" | "reports">("new");
  const [submitting, setSubmitting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [referencePoint, setReferencePoint] = useState("");


  const [gettingLocation, setGettingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [myReports, setMyReports] = useState<Report[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const refreshReports = async () => {
  try {
    const employee = JSON.parse(localStorage.getItem("employee") || "{}");

    if (!employee.id) return;

    const reportsResponse = await fetch(
      `${API_URL}/employees/${employee.id}/reports`
    );
    const reportsData = await reportsResponse.json();
    setMyReports(reportsData);

    reportsData.forEach((report: Report) => {
      loadUnreadCount(report.id);
    });

    const participatingResponse = await fetch(
      `${API_URL}/employees/${employee.id}/participating-reports`
    );
    const participatingData = await participatingResponse.json();
    setAllReports(participatingData);

    participatingData.forEach((report: Report) => {
      loadUnreadCount(report.id);
    });

    if (selectedReport) {
      const updatedSelected =
        [...reportsData, ...participatingData].find(
          (report) => report.id === selectedReport.id
        ) || null;

      if (updatedSelected) {
        setSelectedReport(updatedSelected);
      }
    }
  } catch (error) {
    console.error(error);
  }
};
  useEffect(() => {
  const updateWidth = () => {
    setIsMobileTabs(window.innerWidth < 768);

    if (tabsContainerRef.current) {
      setTabsContainerWidth(tabsContainerRef.current.offsetWidth);
    }
  };

  updateWidth();

  window.addEventListener("resize", updateWidth);

  return () => {
    window.removeEventListener("resize", updateWidth);
  };
}, []);

useEffect(() => {
  const currentIndex = tabsOrder.indexOf(tab);

  if (!tabsContainerWidth) return;

  animate(tabX, -currentIndex * tabsContainerWidth, {
    type: "spring",
    stiffness: 280,
    damping: 32,
  });
}, [tab, tabsContainerWidth]);

const handleTabDragEnd = (_: unknown, info: { offset: { x: number } }) => {
  if (!tabsContainerWidth) return;

  const currentIndex = tabsOrder.indexOf(tab);
  const dragDistance = info.offset.x;
  const limit = tabsContainerWidth * 0.18;

  if (dragDistance < -limit) {
    const nextIndex = Math.min(currentIndex + 1, tabsOrder.length - 1);
    setTab(tabsOrder[nextIndex]);
    setShowFilters(false);
    window.scrollTo(0, 0);
    return;
  }

  if (dragDistance > limit) {
    const previousIndex = Math.max(currentIndex - 1, 0);
    setTab(tabsOrder[previousIndex]);
    setShowFilters(false);
    window.scrollTo(0, 0);
    return;
  }

  animate(tabX, -currentIndex * tabsContainerWidth, {
    type: "spring",
    stiffness: 280,
    damping: 32,
  });
};

  // =========================
  // Load categories and reports
  // =========================

  useEffect(() => {
  socketRef.current = io(API_URL, {
  transports: ["polling", "websocket"],
  reconnectionAttempts: 5,
 query: {
  employeeId: employee.id,
  sessionToken: localStorage.getItem("employeeSessionToken") || "",
},
});

  return () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  };
}, [API_URL]);

useEffect(() => {
  if (!socketRef.current) return;

  const socket = socketRef.current;

  const handlePresenceUpdate = (
    data: { onlineEmployeeIds: number[] }
  ) => {
    setOnlineEmployeeIds(data.onlineEmployeeIds || []);
  };

  socket.on("presence-updated", handlePresenceUpdate);

  const handleNotificationCreated = (notification: AppNotification) => {
  setNotifications((prev) => [notification, ...prev]);
};

socket.on("notification-created", handleNotificationCreated);

const handlePrivateMessage = (message: PrivateMessage) => {
  setPrivateMessages((prev) => {
    if (prev.some((msg) => msg.id === message.id)) return prev;

    if (
      privateConversation &&
      message.conversationId === privateConversation.id
    ) {
      return [...prev, message];
    }

    return prev;
  });

  setTimeout(() => {
    scrollPrivateMessagesToBottom();
  }, 100);
};

socket.on("private-message", handlePrivateMessage);

const handlePrivateMessageUpdated = (message: PrivateMessage) => {
  setPrivateMessages((prev) =>
    prev.map((msg) => (msg.id === message.id ? message : msg))
  );
};


const handlePrivateMessageDeleted = (data: { messageId: number }) => {
  setPrivateMessages((prev) =>
    prev.filter((msg) => msg.id !== data.messageId)
  );
};

socket.on("private-message-updated", handlePrivateMessageUpdated);
socket.on("private-message-deleted", handlePrivateMessageDeleted);

const handleForceLogout = (data: {
  reason?: string;
  sessionToken?: string;
}) => {
  const currentToken = localStorage.getItem("employeeSessionToken");

  if (data.sessionToken && data.sessionToken === currentToken) return;

  localStorage.removeItem("lastActivityAt");
  localStorage.removeItem("employee");
  localStorage.removeItem("employeeSessionToken");
  localStorage.removeItem("welcomeShown");

  logout();
  navigate("/", { replace: true });

  toast({
    title: "Sessão encerrada",
    description:
      data.reason || "Sua conta foi acessada em outro local.",
    variant: "destructive",
  });
};

socket.on("force-logout", handleForceLogout);

  return () => {
    socket.off("presence-updated", handlePresenceUpdate);
    socket.off("notification-created", handleNotificationCreated);
    socket.off("private-message", handlePrivateMessage);
    socket.off("private-message-updated", handlePrivateMessageUpdated);
  socket.off("private-message-deleted", handlePrivateMessageDeleted);
    socket.off("force-logout", handleForceLogout);
  };
}, []);

useEffect(() => {
  validateCurrentSession();

  const interval = window.setInterval(() => {
    validateCurrentSession();
  }, 10000);

  return () => {
    window.clearInterval(interval);
  };
}, []);

useEffect(() => {
  if (!socketRef.current) return;

  const socket = socketRef.current;

  const handleReportsUpdate = () => {
    refreshReports();
  };

 socket.on("reports-updated", handleReportsUpdate);

  return () => {
    socket.off("reports-updated", handleReportsUpdate);
    socket.off("report-created", handleReportsUpdate);
    socket.off("report-updated", handleReportsUpdate);
    socket.off("participant-added", handleReportsUpdate);
    socket.off("participant-removed", handleReportsUpdate);
  };
}, [selectedReport?.id]);

  useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "instant",
  });
}, []);

useEffect(() => {
  if (!showPrivateChatModal) return;

  scrollPrivateMessagesToBottom();
}, [privateMessages.length, showPrivateChatModal]);

useEffect(() => {
  const employee = localStorage.getItem("employee");

  if (!employee) {
    navigate("/", { replace: true });
  }
}, [navigate]);

  useEffect(() => {
  const employee = JSON.parse(
    localStorage.getItem("employee") || "{}"
  );

  const welcomeShown = localStorage.getItem("welcomeShown");

  if (employee.name && !welcomeShown) {
    toast({
  title: `✓ Bem-vindo, ${employee.name}!`,
  description: "Login realizado com sucesso.",
  className:
    "bg-secondary text-secondary-foreground border-secondary",
});

    localStorage.setItem("welcomeShown", "true");
  }
    async function loadData() {
      try {
        const employee = JSON.parse(localStorage.getItem("employee") || "{}");

        // Load categories
        const categoriesResponse = await fetch(`${API_URL}/categories`);
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Load employee reports
        if (employee.id) {
          const reportsResponse = await fetch(
            `${API_URL}/employees/${employee.id}/reports`
          );
          const reportsData = await reportsResponse.json();
          setMyReports(reportsData);
          reportsData.forEach((report: Report) => {
  loadUnreadCount(report.id);
});
          const participatingResponse = await fetch(
  `${API_URL}/employees/${employee.id}/participating-reports`
);





const participatingData = await participatingResponse.json();


setAllReports(participatingData);
participatingData.forEach((report: Report) => {
  loadUnreadCount(report.id);
});


        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Erro ao carregar dados",
          variant: "destructive",
        });
      }
    }

loadData();
loadNotifications();
loadTeamEmployees();
  }, [toast,API_URL]);

  const filteredReports = myReports.filter((report) => {

  const search = searchTerm.toLowerCase();

  const matchesSearch =
    String(report.id).includes(search) ||
    report.description?.toLowerCase().includes(search) ||
    report.referencePoint?.toLowerCase().includes(search) ||
    report.address?.toLowerCase().includes(search) ||
    report.category.name.toLowerCase().includes(search) ||
    report.status.name.toLowerCase().includes(search);

  const matchesStatus =
    statusFilter === "all" || report.status.name === statusFilter;

  const matchesCategory =
    categoryFilter === "all" || String(report.category.id) === categoryFilter;

  return matchesSearch && matchesStatus && matchesCategory;
});

const scrollToMessage = (messageId: number) => {
  const element = messageRefs.current[messageId];

  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  element.classList.add("ring-2", "ring-secondary", "ring-offset-2");

  setTimeout(() => {
    element.classList.remove(
      "ring-2",
      "ring-secondary",
      "ring-offset-2"
    );
  }, 1800);
};

const unreadMessagesCount = selectedReport
  ? Math.max(
      (selectedReport._count?.messages || 0) -
        (readMessagesByReport[selectedReport.id] || 0),
      0
    )
  : 0;

const filteredAllReports = allReports.filter((report) => {
    
  const search = searchTerm.toLowerCase();

  const matchesSearch =
    String(report.id).includes(search) ||
    report.title?.toLowerCase().includes(search) ||
    report.description?.toLowerCase().includes(search) ||
    report.referencePoint?.toLowerCase().includes(search) ||
    report.address?.toLowerCase().includes(search) ||
    report.employee?.name?.toLowerCase().includes(search) ||
    report.category.name.toLowerCase().includes(search) ||
    report.status.name.toLowerCase().includes(search);

  const matchesStatus =
    statusFilter === "all" || report.status.name === statusFilter;

  const matchesCategory =
    categoryFilter === "all" || String(report.category.id) === categoryFilter;

  return matchesSearch && matchesStatus && matchesCategory;
});

const unreadNotificationsCount = notifications.filter(
  (notification) => !notification.readAt
).length;

const teamDepartments = Array.from(
  new Set(
    teamEmployees
      .map((emp) => emp.department)
      .filter(Boolean)
  )
);

const filteredTeamEmployees = teamEmployees.filter((emp) => {
  const search = teamSearch.toLowerCase();

  const matchesSearch =
    emp.name.toLowerCase().includes(search) ||
    emp.registrationNumber.includes(search) ||
    emp.department?.toLowerCase().includes(search);

  const matchesDepartment =
    teamDepartmentFilter === "all" ||
    emp.department === teamDepartmentFilter;

  return matchesSearch && matchesDepartment;
});

const messageSearchResults = messages.filter((msg) =>
  msg.message.toLowerCase().includes(messageSearchTerm.toLowerCase())
);

const goToSearchResult = (index: number) => {
  const result = messageSearchResults[index];

  if (!result) return;

  setCurrentSearchIndex(index);
  scrollToMessage(result.id);
};

const privateMessageSearchResults = privateMessages.filter((msg) =>
  msg.message
    ?.toLowerCase()
    .includes(privateMessageSearchTerm.toLowerCase())
);

const scrollToPrivateMessage = (messageId: number) => {
  const element = privateMessageRefs.current[messageId];

  if (!element) {
    console.log("Mensagem original não encontrada:", messageId);
    return;
  }

  const container = privateMessagesContainerRef.current;

  if (container) {
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const top =
      container.scrollTop +
      elementRect.top -
      containerRect.top -
      container.clientHeight / 2 +
      element.clientHeight / 2;

    container.scrollTo({
      top,
      behavior: "smooth",
    });
  } else {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  element.classList.add(
    "ring-2",
    "ring-green-300",
    "ring-offset-2",
    "rounded-2xl"
  );

  setTimeout(() => {
    element.classList.remove(
      "ring-2",
      "ring-green-300",
      "ring-offset-2",
      "rounded-2xl"
    );
  }, 1800);
};

const goToPrivateSearchResult = (index: number) => {
  const result = privateMessageSearchResults[index];

  if (!result) return;

  setCurrentPrivateSearchIndex(index);
  scrollToPrivateMessage(result.id);
};

const scrollMessagesToBottom = () => {
  requestAnimationFrame(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 300);
  });
};

const scrollPrivateMessagesToBottom = () => {
  requestAnimationFrame(() => {
    setTimeout(() => {
      const container = privateMessagesContainerRef.current;

      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }

      privateMessagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 120);
  });
};

const handleMessagesScroll = () => {
  if (!messagesContainerRef.current) return;

  const container = messagesContainerRef.current;

  const distanceFromBottom =
    container.scrollHeight -
    container.scrollTop -
    container.clientHeight;

  const nearBottom = distanceFromBottom < 120;

  isNearBottomRef.current = nearBottom;
  setIsNearBottom(nearBottom);

  if (nearBottom) {
    setNewMessagesCount(0);

    if (selectedReport) {
      markMessagesAsRead(selectedReport.id);
    }
  }
};

const loadUnreadCount = async (reportId: number) => {
  const employee = JSON.parse(localStorage.getItem("employee") || "{}");

  if (!employee.id) return;

  try {
    const response = await fetch(
      `${API_URL}/reports/${reportId}/unread-count/${employee.id}`
    );

    const data = await response.json();

    setUnreadCounts((prev) => ({
  ...prev,
  [reportId]: data.unreadCount || 0,
}));
  } catch (error) {
    console.error(error);
  }
};

useEffect(() => {
  const handleClickOutside = () => {
    setMessageMenuId(null);
    setPrivateMessageMenuId(null);
  };

  document.addEventListener("pointerdown", handleClickOutside);

  return () => {
    document.removeEventListener("pointerdown", handleClickOutside);
  };
}, []);

const markMessagesAsRead = async (reportId: number) => {
  const employee = JSON.parse(localStorage.getItem("employee") || "{}");

  if (!employee.id) return;

  try {
    await fetch(`${API_URL}/reports/${reportId}/mark-read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employeeId: employee.id,
      }),
    });

    setUnreadCounts((prev) => ({
      ...prev,
      [reportId]: 0,
    }));
  } catch (error) {
    console.error(error);
  }
};
const sendTypingSignal = async () => {
  if (!selectedReport) return;

  const employee = JSON.parse(localStorage.getItem("employee") || "{}");

  if (!employee.id || !employee.name) return;

  try {
    await fetch(`${API_URL}/reports/${selectedReport.id}/typing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employeeId: employee.id,
        employeeName: employee.name,
      }),
    });
  } catch (error) {
    console.error(error);
  }
};

const sendPrivateTypingSignal = async () => {
  if (!privateConversation) return;

  const employeeData = JSON.parse(
    localStorage.getItem("employee") || "{}"
  );

  if (!employeeData.id || !employeeData.name) return;

  try {
    await fetch(
      `${API_URL}/private-conversations/${privateConversation.id}/typing`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employeeData.id,
          employeeName: employeeData.name,
        }),
      }
    );
  } catch (error) {
    console.error(error);
  }
};

const loadPrivateTypingUsers = async () => {
  if (!privateConversation) return;

  const employeeData = JSON.parse(
    localStorage.getItem("employee") || "{}"
  );

  try {
    const response = await fetch(
      `${API_URL}/private-conversations/${privateConversation.id}/typing?employeeId=${employeeData.id}`
    );

    const data = await response.json();

    setPrivateTypingUsers(data.typingUsers || []);
  } catch (error) {
    console.error(error);
  }
};

const loadTypingUsers = async () => {
  if (!selectedReport) return;

  const employee = JSON.parse(localStorage.getItem("employee") || "{}");

  try {
    const response = await fetch(
      `${API_URL}/reports/${selectedReport.id}/typing?employeeId=${employee.id}`
    );

    const data = await response.json();

    setTypingUsers(data.typingUsers || []);
  } catch (error) {
    console.error(error);
  }
};

useEffect(() => {
  if (!showMessagesModal || !selectedReport) return;

  const interval = setInterval(() => {
    loadTypingUsers();
  }, 1000);

  return () => clearInterval(interval);
}, [showMessagesModal, selectedReport?.id]);

useEffect(() => {
  if (!showPrivateChatModal || !privateConversation) return;

  const interval = setInterval(() => {
    loadPrivateTypingUsers();
  }, 1000);

  return () => clearInterval(interval);
}, [showPrivateChatModal, privateConversation?.id]);

useEffect(() => {
  if (!showMessagesModal || !selectedReport || !socketRef.current) return;

  const socket = socketRef.current;

  socket.emit("join-report", selectedReport.id);

  socket.on("new-message", (message: ReportMessage) => {
    setMessages((prev) => {
      if (prev.some((msg) => msg.id === message.id)) return prev;
      return [...prev, message];
    });

    lastMessageIdRef.current = message.id;

    if (message.senderId !== employee.id) {
      if (isNearBottomRef.current) {
        markMessagesAsRead(selectedReport.id);
        jumpMessagesToBottom();
      } else {
        setNewMessagesCount((prev) => prev + 1);
      }
    }
  });

  socket.on("messages-read", ({ employeeId, lastReadMessageId }) => {
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        readByEmployeeIds:
          lastReadMessageId && msg.id <= lastReadMessageId
            ? Array.from(new Set([...(msg.readByEmployeeIds || []), employeeId]))
            : msg.readByEmployeeIds,
      }))
    );
  });

  return () => {
    socket.emit("leave-report", selectedReport.id);
    socket.off("new-message");
    socket.off("messages-read");
  };
}, [showMessagesModal, selectedReport?.id]);
const loadMessages = async (reportId: number) => {
  setLoadingMessages(true);

  try {
    const response = await fetch(`${API_URL}/reports/${reportId}/messages`);
    const data: ReportMessage[] = await response.json();

    const lastOldId = lastMessageIdRef.current;
    const lastNewId = data[data.length - 1]?.id || null;

    const hasNewMessage =
      lastOldId !== null &&
      lastNewId !== null &&
      lastNewId !== lastOldId;

    if (hasNewMessage) {
      const newMessages = data.filter((msg) => msg.id > lastOldId);
      const newMessagesFromOthers = newMessages.filter(
        (msg) => msg.senderId !== employee.id
      );

      if (newMessagesFromOthers.length > 0 && !isNearBottomRef.current) {
        setNewMessagesCount((prev) => prev + newMessagesFromOthers.length);
      }

      if (isNearBottomRef.current) {
        setTimeout(() => {
          jumpMessagesToBottom();
          markMessagesAsRead(reportId);
        }, 50);
      }
    }

    setMessages(data);
    lastMessageIdRef.current = lastNewId;
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro ao carregar mensagens",
      variant: "destructive",
    });
  } finally {
    setLoadingMessages(false);
  }
};

const getPrivateChatTitle = () => {
  if (!privateConversation) return "Conversa";

  const otherParticipant = privateConversation.participants.find(
    (participant) => participant.employee.id !== employee.id
  );

  return otherParticipant?.employee.name || "Conversa";
};

const loadPrivateMessages = async (conversationId: number) => {
  setLoadingPrivateMessages(true);

  try {
    const response = await fetch(
      `${API_URL}/private-conversations/${conversationId}/messages`
    );

    const data = await response.json();

    setPrivateMessages(data);
  } catch (error) {
    console.error(error);

    toast({
      title: "Erro ao carregar conversa",
      variant: "destructive",
    });
  } finally {
    setLoadingPrivateMessages(false);
  }
};

const openPrivateConversation = async (otherEmployeeId: number) => {
  try {
    const response = await fetch(`${API_URL}/private-conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employeeId: employee.id,
        otherEmployeeId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Erro ao abrir conversa",
        description: data.error || "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    setPrivateConversation(data);
    setShowTeamPanel(false);
    setShowPrivateChatModal(true);

    await loadPrivateMessages(data.id);

    setTimeout(() => {
  scrollPrivateMessagesToBottom();
}, 150);

    socketRef.current?.emit("join-private-conversation", data.id);
  } catch (error) {
    console.error(error);

    toast({
      title: "Erro ao conectar com o servidor",
      variant: "destructive",
    });
  }
};

const startPrivateAudioRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const mimeType =
      MediaRecorder.isTypeSupported("audio/mp4;codecs=mp4a.40.2")
        ? "audio/mp4;codecs=mp4a.40.2"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined
    );

    privateMediaRecorderRef.current = recorder;
    privateAudioChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        privateAudioChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const finalMimeType = recorder.mimeType || mimeType || "audio/webm";
      const extension = finalMimeType.includes("mp4") ? "m4a" : "webm";

      const audioBlob = new Blob(privateAudioChunksRef.current, {
        type: finalMimeType,
      });

      const audioFile = new File(
        [audioBlob],
        `audio-privado-${Date.now()}.${extension}`,
        { type: finalMimeType }
      );

      setPrivateChatFiles((prev) => [...prev, audioFile]);

      stream.getTracks().forEach((track) => track.stop());

      if (privateAudioTimerRef.current) {
        window.clearInterval(privateAudioTimerRef.current);
      }

      setIsRecordingPrivateAudio(false);
      setPrivateAudioSeconds(0);
      privateMediaRecorderRef.current = null;
      privateAudioChunksRef.current = [];
    };

    recorder.start();
    setIsRecordingPrivateAudio(true);
    setPrivateAudioSeconds(0);

    privateAudioTimerRef.current = window.setInterval(() => {
      setPrivateAudioSeconds((prev) => prev + 1);
    }, 1000);
  } catch (error) {
    toast({
      title: "Microfone bloqueado",
      description: "Permita o acesso ao microfone para gravar áudio.",
      variant: "destructive",
    });
  }
};

const stopPrivateAudioRecording = () => {
  if (privateMediaRecorderRef.current?.state === "recording") {
    privateMediaRecorderRef.current.stop();
  }
};

const sendPrivateMessage = async () => {
  if (
  !privateConversation ||
  sendingPrivateMessage ||
  (!privateMessageText.trim() && privateChatFiles.length === 0)
) {
  return;
}

  setSendingPrivateMessage(true);

  try {
    const mediaItems = privateChatFiles.length
  ? await Promise.all(
      privateChatFiles.map((file) => uploadImageToCloudinary(file))
    )
  : [];
    const response = await fetch(
      `${API_URL}/private-conversations/${privateConversation.id}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
  senderId: employee.id,
 message: privateMessageText.trim() || "",
  mediaItems,
replyToMessageId: replyingToPrivateMessage?.id || null,
}),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Erro ao enviar mensagem",
        description: data.error || "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    setPrivateMessages((prev) => {
      if (prev.some((msg) => msg.id === data.id)) return prev;
      return [...prev, data];
    });

    setPrivateMessageText("");
    setReplyingToPrivateMessage(null);
    setPrivateChatFiles([]);
    setTimeout(() => {
  scrollPrivateMessagesToBottom();
}, 100);

if (privateChatFileInputRef.current) {
  privateChatFileInputRef.current.value = "";
}
  } catch (error) {
    console.error(error);

    toast({
      title: "Erro ao conectar com o servidor",
      variant: "destructive",
    });
  } finally {
    setSendingPrivateMessage(false);
  }
};

const updatePrivateMessage = async () => {
  if (
    !privateConversation ||
    !editingPrivateMessageId ||
    !editingPrivateMessageText.trim()
  ) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/private-conversations/${privateConversation.id}/messages/${editingPrivateMessageId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: employee.id,
          message: editingPrivateMessageText.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Erro ao editar mensagem",
        description: data.error || "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    setPrivateMessages((prev) =>
      prev.map((msg) => (msg.id === data.id ? data : msg))
    );

    setEditingPrivateMessageId(null);
    setEditingPrivateMessageText("");
    setPrivateMessageMenuId(null);
  } catch (error) {
    console.error(error);
  }
};

const deletePrivateMessage = async (messageId: number) => {
  if (!privateConversation) return;

  try {
    const response = await fetch(
      `${API_URL}/private-conversations/${privateConversation.id}/messages/${messageId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: employee.id,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Erro ao apagar mensagem",
        description: data.error || "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    setPrivateMessages((prev) =>
      prev.filter((msg) => msg.id !== messageId)
    );

    setPrivateMessageMenuId(null);
  } catch (error) {
    console.error(error);
  }
};

const closePrivateChat = () => {
  if (privateConversation) {
    socketRef.current?.emit(
      "leave-private-conversation",
      privateConversation.id
    );
  }

  setShowPrivateChatModal(false);
  setPrivateConversation(null);
  setPrivateMessages([]);
  setPrivateMessageText("");
};

const loadTeamEmployees = async () => {
  try {
    const response = await fetch(`${API_URL}/employees/team`);
    const data = await response.json();

    setTeamEmployees(data);
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro ao carregar equipe",
      variant: "destructive",
    });
  }
};

const loadNotifications = async () => {
  const employee = JSON.parse(localStorage.getItem("employee") || "{}");

  if (!employee.id) return;

  try {
    const response = await fetch(`${API_URL}/notifications/${employee.id}`);
    const data = await response.json();

    setNotifications(data);
  } catch (error) {
    console.error(error);
  }
};

const markNotificationAsRead = async (notificationId: number) => {
  try {
    await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: "POST",
    });

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              readAt: new Date().toISOString(),
            }
          : notification
      )
    );
  } catch (error) {
    console.error(error);
  }
};

const markAllNotificationsAsRead = async () => {
  const employee = JSON.parse(localStorage.getItem("employee") || "{}");

  if (!employee.id) return;

  try {
    await fetch(`${API_URL}/notifications/${employee.id}/read-all`, {
      method: "POST",
    });

    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        readAt: notification.readAt || new Date().toISOString(),
      }))
    );
  } catch (error) {
    console.error(error);
  }
};

const openNotification = async (notification: AppNotification) => {
  await markNotificationAsRead(notification.id);

  if (notification.reportId) {
    const report =
      [...myReports, ...allReports].find(
        (item) => item.id === notification.reportId
      ) || null;

    if (report) {
      openReportDetails(report);

      setShowNotificationsPanel(false);
      setShowQuickMenu(false);

      if (notification.messageId) {
        setTimeout(() => {
          scrollToMessage(notification.messageId!);
        }, 700);
      }
    }
  }
};



const loadEmployees = async () => {
  try {
    const response = await fetch(`${API_URL}/employees`);
    const data = await response.json();

    setEmployees(data);
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro ao carregar funcionários",
      variant: "destructive",
    });
  }
};

const openParticipantModal = () => {
  setEmployeeSearch("");
  setShowParticipantModal(true);

  if (employees.length === 0) {
    loadEmployees();
  }
};

const deleteMessage = async (messageId: number) => {
  if (!selectedReport) return;

  const employee = JSON.parse(localStorage.getItem("employee") || "{}");

  try {
    const response = await fetch(
      `${API_URL}/reports/${selectedReport.id}/messages/${messageId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: employee.id,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Erro ao apagar mensagem",
        description: data.error || "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

    setMyReports((prev) =>
      prev.map((report) =>
        report.id === selectedReport.id
          ? {
              ...report,
              _count: {
                messages: Math.max((report._count?.messages || 1) - 1, 0),
              },
            }
          : report
      )
    );

    setAllReports((prev) =>
      prev.map((report) =>
        report.id === selectedReport.id
          ? {
              ...report,
              _count: {
                messages: Math.max((report._count?.messages || 1) - 1, 0),
              },
            }
          : report
      )
    );

    toast({
      title: "Mensagem apagada.",
    });
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro ao conectar com o servidor",
      variant: "destructive",
    });
  }
};

const updateMessage = async () => {
  if (!selectedReport || !editingMessageId || !editingMessageText.trim()) {
    return;
  }

  const employee = JSON.parse(localStorage.getItem("employee") || "{}");

  try {
    const response = await fetch(
      `${API_URL}/reports/${selectedReport.id}/messages/${editingMessageId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: employee.id,
          message: editingMessageText.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Erro ao editar mensagem",
        description: data.error || "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    setMessages((prev) =>
      prev.map((msg) => (msg.id === data.id ? data : msg))
    );

    setEditingMessageId(null);
    setEditingMessageText("");
    setMessageMenuId(null);

    toast({
      title: "Mensagem editada.",
    });
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro ao conectar com o servidor",
      variant: "destructive",
    });
  }
};

const addParticipant = async (employeeId: number) => {
  if (!selectedReport) return;

  setAddingParticipant(true);

  try {
    const response = await fetch(
      `${API_URL}/reports/${selectedReport.id}/participants`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employeeId }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Erro ao adicionar participante",
        description: data.error || "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    const updatedReport = {
      ...selectedReport,
      participants: [
        ...(selectedReport.participants || []),
        data,
      ],
    };

    setSelectedReport(updatedReport);

    setMyReports((prev) =>
      prev.map((report) =>
        report.id === updatedReport.id ? updatedReport : report
      )
    );

    setAllReports((prev) =>
      prev.map((report) =>
        report.id === updatedReport.id ? updatedReport : report
      )
    );

    toast({
      title: "Participante adicionado!",
    });

    setShowParticipantModal(false);
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro ao conectar com o servidor",
      variant: "destructive",
    });
  } finally {
    setAddingParticipant(false);
  }
};

const removeParticipant = async (participantId: number) => {
  if (!selectedReport) return;

  const employee = JSON.parse(localStorage.getItem("employee") || "{}");

  try {
    const response = await fetch(
      `${API_URL}/reports/${selectedReport.id}/participants/${participantId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employee.id,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Erro ao remover participante",
        description: data.error || "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    const updatedReport = {
      ...selectedReport,
      participants: (selectedReport.participants || []).filter(
        (participant) => participant.id !== participantId
      ),
    };

    setSelectedReport(updatedReport);

    setMyReports((prev) =>
      prev.map((report) =>
        report.id === updatedReport.id ? updatedReport : report
      )
    );

    setAllReports((prev) =>
      prev.map((report) =>
        report.id === updatedReport.id ? updatedReport : report
      )
    );

    toast({
      title: "Participante removido.",
    });
  } catch (error) {
    console.error(error);

    toast({
      title: "Erro ao conectar com o servidor",
      variant: "destructive",
    });
  }
};

const filteredEmployees = employees.filter((emp) => {
  const search = employeeSearch.toLowerCase();

  const alreadyParticipant = selectedReport?.participants?.some(
    (participant) => participant.employee.id === emp.id
  );

  return (
    !alreadyParticipant &&
    (emp.name.toLowerCase().includes(search) ||
      emp.registrationNumber.includes(search) ||
      emp.department?.toLowerCase().includes(search))
  );
});

const startAudioRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const mimeType =
      MediaRecorder.isTypeSupported("audio/mp4;codecs=mp4a.40.2")
        ? "audio/mp4;codecs=mp4a.40.2"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined
    );
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const finalMimeType = recorder.mimeType || mimeType || "audio/webm";
      const extension = finalMimeType.includes("mp4") ? "m4a" : "webm";
      const audioBlob = new Blob(audioChunksRef.current, {
        type: finalMimeType,
      });

      const audioFile = new File(
        [audioBlob],
        `audio-${Date.now()}.${extension}`,
        { type: finalMimeType }
      );

      setChatFiles((prev) => [...prev, audioFile]);

      stream.getTracks().forEach((track) => track.stop());

      if (audioTimerRef.current) {
        window.clearInterval(audioTimerRef.current);
      }

      setIsRecordingAudio(false);
      setAudioSeconds(0);
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    };

    recorder.start();
    setIsRecordingAudio(true);
    setAudioSeconds(0);

    audioTimerRef.current = window.setInterval(() => {
      setAudioSeconds((prev) => prev + 1);
    }, 1000);
  } catch (error) {
    toast({
      title: "Microfone bloqueado",
      description: "Permita o acesso ao microfone para gravar áudio.",
      variant: "destructive",
    });
  }
};

const stopAudioRecording = () => {
  if (mediaRecorderRef.current?.state === "recording") {
    mediaRecorderRef.current.stop();
  }
};

useEffect(() => {
  return () => {
    if (audioTimerRef.current) {
      window.clearInterval(audioTimerRef.current);
    }

    mediaRecorderRef.current?.stream
      ?.getTracks()
      ?.forEach((track) => track.stop());

    if (privateAudioTimerRef.current) {
      window.clearInterval(privateAudioTimerRef.current);
    }

    privateMediaRecorderRef.current?.stream
      ?.getTracks()
      ?.forEach((track) => track.stop());
  };
}, []);

const sendMessage = async () => {
 if (
  sendingMessageRef.current ||
  sendingMessage ||
  !selectedReport ||
  (!newMessage.trim() && chatFiles.length === 0)
) {
  return;
}

sendingMessageRef.current = true;
setSendingMessage(true);

  try {
    const employee = JSON.parse(localStorage.getItem("employee") || "{}");

const mediaItems = chatFiles.length
  ? await Promise.all(chatFiles.map((file) => uploadImageToCloudinary(file)))
  : [];

    const response = await fetch(
      `${API_URL}/reports/${selectedReport.id}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  senderId: employee.id,
  mediaItems,
  senderName: employee.name,
  senderRole: "EMPLOYEE",
  message: newMessage.trim(),
  replyToMessageId: replyingTo?.id || null,
}),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Erro ao enviar mensagem",
        description: data.error || "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    setMessages((prev) => {
  if (prev.some((msg) => msg.id === data.id)) return prev;

  return [
    ...prev,
    {
      ...data,
      media: data.media || [],
    },
  ];
});

lastMessageIdRef.current = data.id;

setNewMessagesCount(0);

isNearBottomRef.current = true;
setIsNearBottom(true);

setTimeout(() => {
  scrollMessagesToBottom();
}, 100);
    setMyReports((prev) =>
  prev.map((report) =>
    report.id === data.reportId
      ? {
          ...report,
          _count: {
            messages: (report._count?.messages || 0) + 1,
          },
        }
      : report
  )
);

setAllReports((prev) =>
  prev.map((report) =>
    report.id === data.reportId
      ? {
          ...report,
          _count: {
            messages: (report._count?.messages || 0) + 1,
          },
        }
      : report
  )
);
    setReplyingTo(null);
    setNewMessage("");
    setChatFiles([]);


if (chatFileInputRef.current) {
  chatFileInputRef.current.value = "";
}

await loadMessages(selectedReport.id);

    markMessagesAsRead(selectedReport.id);
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro ao conectar com o servidor",
      variant: "destructive",
    });
  } finally {
    sendingMessageRef.current = false;
setSendingMessage(false);
  }
};

  // =========================
  // Image Upload
  // =========================

  const downloadMedia = async (url: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    const blobUrl = window.URL.createObjectURL(blob);

    const fileExtension = url.includes(".mp4")
      ? "mp4"
      : url.includes(".m4a")
      ? "m4a"
      : url.includes(".webm")
      ? "webm"
      : url.includes(".mov")
      ? "mov"
      : url.includes(".png")
      ? "png"
      : "jpg";

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `chamado-midia.${fileExtension}`;
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro ao baixar mídia",
      variant: "destructive",
    });
  }
};
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  

  const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);

if (oversizedFile) {
  toast({
    title: "Arquivo muito grande",
    description: "Cada arquivo deve ter no máximo 100 MB.",
    variant: "destructive",
  });

  e.target.value = "";
  return;
}

  if (files.length === 0) return;

  setSelectedFiles(files);
  setCurrentImageIndex(0);

  const previews: string[] = [];

  files.forEach((file) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      previews.push(reader.result as string);

      if (previews.length === files.length) {
        setImagePreviews(previews);
      }
    };

    reader.readAsDataURL(file);
  });
};




  // =========================
  // GPS
  // =========================
  const getLocation = () => {
  setGettingLocation(true);



  if (!navigator.geolocation) {
    setGettingLocation(false);
    toast({
      title: "GPS não suportado",
      description: "Seu navegador não suporta geolocalização.",
      variant: "destructive",
    });
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;

      setCoords({
        lat: latitude,
        lng: longitude,
      });

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );

        const data = await response.json();

        const road = data.address?.road || "Rua não identificada";
        const suburb =
          data.address?.suburb ||
          data.address?.neighbourhood ||
          "";
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          "";
        const state = data.address?.state || "";

        const addressText = [road, suburb, city, state]
          .filter(Boolean)
          .join(", ");
          setAddress(addressText);

        toast({
          title: "Localização capturada!",
          description:
            `${addressText}\n` +
            `Lat: ${latitude.toFixed(6)} | ` +
            `Lng: ${longitude.toFixed(6)}`,
        });
      } catch (error) {
        toast({
          title: "Localização capturada!",
          description:
            `Lat: ${latitude.toFixed(6)} | ` +
            `Lng: ${longitude.toFixed(6)}`,
        });
      }

      setGettingLocation(false);
    },
    (error) => {
      console.error("Erro ao obter localização:", error);

      setGettingLocation(false);

      toast({
        title: "Não foi possível obter localização",
        description:
          "Permita o acesso à localização no navegador.",
        variant: "destructive",
      });
    },
    {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 60000,
    }
  );
};

const uploadImageToCloudinary = async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append(
    "upload_preset",
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    }/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    throw new Error(
      data.error?.message || "Erro ao enviar arquivo para o Cloudinary"
    );
  }

  const isAudio = file.type.startsWith("audio/");

  return {
    imageUrl: isAudio
      ? getCloudinaryAudioPlaybackUrl(data.secure_url)
      : data.secure_url,
    publicId: data.public_id,
    resourceType: isAudio ? "audio" : data.resource_type || "image",
  };
};

  // =========================
  // Submit report
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0)  {
      toast({
        title: "Foto obrigatória",
        description: "Tire ou envie uma foto do problema.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
  toast({
    title: "Nome do chamado obrigatório",
    variant: "destructive",
  });
  return;
}

    if (!categoryId) {
      toast({
        title: "Categoria obrigatória",
        variant: "destructive",
      });
      return;
    }
  setSubmitting(true);
    try {
      const employee = JSON.parse(localStorage.getItem("employee") || "{}");

      if (!employee.id) {
        toast({
          title: "Funcionário não encontrado",
          description: "Faça login novamente.",
          variant: "destructive",
        });
        return;
      }
let finalCoords = coords;
let finalAddress = address;

if (address) {
  const result = await geocodeAddress(address);

  if (result) {
    finalCoords = {
      lat: result.lat,
      lng: result.lng,
    };

    finalAddress = result.displayName;
    setAddress(result.displayName);
  }
}

      const loc = finalCoords || {
  lat: null,
  lng: null,
};
let imageUrl = null;

console.log("URL da imagem enviada:", imageUrl);

const mediaItems = await Promise.all(
  selectedFiles.map((file) => uploadImageToCloudinary(file))
);

      const response = await fetch(`${API_URL}/reports`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
  employeeId: employee.id,
  categoryId: Number(categoryId),
  title,
  description,
  referencePoint,
  latitude: loc.lat,
  longitude: loc.lng,
  address: finalAddress,
  mediaItems,
}),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao criar chamado",
          description: data.error || "Erro desconhecido",
          variant: "destructive",
        });
        return;
      }

      setMyReports((prev) => [data, ...prev]);
      setAllReports((prev) => [data, ...prev]);

      toast({
        title: "Chamado enviado com sucesso!",
      });

      // Reset form
      setCategoryId("");
      setTitle("");
      setDescription("");
      setReferencePoint("");
      setAddress("");
      setImagePreviews([]);
      setSelectedFiles([]);
      setCurrentImageIndex(0);
      setCoords(null);

      setTab("history");
    } catch (error) {
  console.error(error);
  toast({
    title: "Erro ao conectar com o servidor",
    variant: "destructive",
  });
} finally {
  setSubmitting(false);
}};

const getEditLocation = () => {
  setGettingLocation(true);

  if (!navigator.geolocation) {
    setGettingLocation(false);
    toast({
      title: "GPS não suportado",
      description: "Seu navegador não suporta geolocalização.",
      variant: "destructive",
    });
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;

      setEditCoords({
        lat: latitude,
        lng: longitude,
      });

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );

        const data = await response.json();

        const road = data.address?.road || "Rua não identificada";
        const suburb =
          data.address?.suburb ||
          data.address?.neighbourhood ||
          "";
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          "";
        const state = data.address?.state || "";

        const addressText = [road, suburb, city, state]
          .filter(Boolean)
          .join(", ");

        setEditAddress(addressText);

        toast({
          title: "Localização atualizada!",
          description:
            `${addressText}\n` +
            `Lat: ${latitude.toFixed(6)} | ` +
            `Lng: ${longitude.toFixed(6)}`,
        });
      } catch {
        toast({
          title: "Localização atualizada!",
          description:
            `Lat: ${latitude.toFixed(6)} | ` +
            `Lng: ${longitude.toFixed(6)}`,
        });
      }

      setGettingLocation(false);
    },
    () => {
      setGettingLocation(false);

      toast({
        title: "Não foi possível obter localização",
        description: "Permita o acesso à localização no navegador.",
        variant: "destructive",
      });
    },
    {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 60000,
    }
  );
};

const jumpMessagesToBottom = () => {
  setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "auto",
      block: "end",
    });
  }, 0);
};

useEffect(() => {
  const handleClickOutsideEmoji = (event: MouseEvent | TouchEvent) => {
    if (
      emojiPickerRef.current &&
      !emojiPickerRef.current.contains(event.target as Node)
    ) {
      setShowEmojiPicker(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutsideEmoji);
  document.addEventListener("touchstart", handleClickOutsideEmoji);

  return () => {
    document.removeEventListener("mousedown", handleClickOutsideEmoji);
    document.removeEventListener("touchstart", handleClickOutsideEmoji);
  };
}, []);

const geocodeAddress = async (typedAddress: string) => {
  if (!typedAddress.trim()) return null;

  setGeocoding(true);

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        typedAddress
      )}&limit=1`
    );

    const data = await response.json();

    if (!data || data.length === 0) {
      toast({
        title: "Endereço não encontrado",
        description: "Tente informar rua, número, bairro e cidade.",
        variant: "destructive",
      });
      return null;
    }

    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      displayName: data[0].display_name,
    };
  } finally {
    setGeocoding(false);
  }
};

useEffect(() => {
  const updateLastActivity = () => {
    localStorage.setItem("lastActivityAt", String(Date.now()));
  };

  const checkInactivity = () => {
    const lastActivityAt = Number(localStorage.getItem("lastActivityAt") || 0);

    if (!lastActivityAt) {
      updateLastActivity();
      return;
    }

    const inactiveTime = Date.now() - lastActivityAt;

    if (inactiveTime > INACTIVITY_LIMIT) {
      localStorage.removeItem("welcomeShown");
      localStorage.removeItem("employee");
localStorage.removeItem("employeeSessionToken");
logout();
navigate("/", { replace: true });
    }
  };

  const handleUserActivity = () => {
    updateLastActivity();
  };

  updateLastActivity();

  window.addEventListener("click", handleUserActivity);
  window.addEventListener("keydown", handleUserActivity);
  window.addEventListener("touchstart", handleUserActivity);
  window.addEventListener("scroll", handleUserActivity);

  window.addEventListener("focus", checkInactivity);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      checkInactivity();
    }
  });

  return () => {
    window.removeEventListener("click", handleUserActivity);
    window.removeEventListener("keydown", handleUserActivity);
    window.removeEventListener("touchstart", handleUserActivity);
    window.removeEventListener("scroll", handleUserActivity);

    window.removeEventListener("focus", checkInactivity);
  };
}, [logout, navigate]);
  

  // =========================
  // Logout
  // =========================
  const handleLogout = () => {
  localStorage.removeItem("lastActivityAt");
  localStorage.removeItem("welcomeShown");
  localStorage.removeItem("employee");
  localStorage.removeItem("employeeSessionToken");

  logout();

  navigate("/", { replace: true });
};

const validateCurrentSession = async () => {
  try {
    const employeeData = JSON.parse(
      localStorage.getItem("employee") || "{}"
    );

    if (!employeeData?.id) return;

    const localToken =
      localStorage.getItem("employeeSessionToken");

    const response = await fetch(
      `${API_URL}/employee-session/${employeeData.id}`
    );

    const data = await response.json();

    if (
      data.activeSessionToken &&
      data.activeSessionToken !== localToken
    ) {
      toast({
        title: "Sessão encerrada",
        description:
          "Sua conta foi acessada em outro dispositivo.",
        variant: "destructive",
      });

      handleLogout();
    }
  } catch (error) {
    console.error(error);
  }
};
  const openReportDetails = (report: Report) => {
  setShowMessageSearch(false);
  setMessageSearchTerm("");
  setCurrentSearchIndex(0);
  setEditTitle(report.title || "");
  setSelectedReport(report);
  setEditAddress(report.address || "");
  setEditCoords(
  report.latitude && report.longitude
    ? { lat: report.latitude, lng: report.longitude }
    : null
);
  setDetailImageIndex(0);
  setIsEditing(false);
  setEditCategoryId(String(report.category.id));
  setEditDescription(report.description || "");
  setEditReferencePoint(report.referencePoint || "");
  loadMessages(report.id);
};

const handleUpdateReport = async () => {
  if (!selectedReport) return;
  

  setSavingEdit(true);

  try {
    let finalEditCoords = editCoords;
    let finalEditAddress = editAddress;

    if (editAddress) {
      const result = await geocodeAddress(editAddress);

      if (result) {
        finalEditCoords = {
          lat: result.lat,
          lng: result.lng,
        };

        finalEditAddress = result.displayName;
      }
    }

    const response = await fetch(`${API_URL}/reports/${selectedReport.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        categoryId: Number(editCategoryId),
        description: editDescription,
        title: editTitle,
        referencePoint: editReferencePoint,
        latitude: finalEditCoords?.lat ?? selectedReport.latitude,
        longitude: finalEditCoords?.lng ?? selectedReport.longitude,
        address: finalEditAddress,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast({
        title: "Erro ao atualizar chamado",
        description: data.error || "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    setMyReports((prev) =>
      prev.map((report) => (report.id === data.id ? data : report))
    );

    setAllReports((prev) =>
  prev.map((report) => (report.id === data.id ? data : report))
);

    setSelectedReport(data);
    setIsEditing(false);

    toast({
      title: "Chamado atualizado com sucesso!",
    });
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro ao conectar com o servidor",
      variant: "destructive",
    });
  } finally {
    setSavingEdit(false);
  }
};

const getMessageReadStatus = (msg: ReportMessage) => {
  const otherParticipants =
    selectedReport?.participants
      ?.map((participant) => participant.employee.id)
      .filter((id) => id !== msg.senderId) || [];

  if (otherParticipants.length === 0) {
    return "sent";
  }

  const readBy = msg.readByEmployeeIds || [];

  const allRead = otherParticipants.every((id) =>
    readBy.includes(id)
  );

  return allRead ? "read" : "delivered";
};

const renderMessages = () => {
  return messages.map((msg) => {
    const isMine = msg.senderId === employee.id;

    return (
      <div
  key={msg.id}
  ref={(el) => {
    messageRefs.current[msg.id] = el;
  }}
        className={`relative flex ${isMine ? "justify-end" : "justify-start"}`}
        onContextMenu={(e) => {
          e.preventDefault();
          setMessageMenuId(msg.id);
        }}

      >
        <div
          className="relative max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm bg-white text-gray-900 border border-gray-200"
        >
          <button
  type="button"
  onClick={() =>
    setMessageMenuId(messageMenuId === msg.id ? null : msg.id)
  }
className="flex absolute top-1 right-1 z-20 h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:bg-gray-100 hover:text-gray-900"
>
  <ChevronDown className="w-4 h-4 pointer-events-none" />
</button>

          <div className="mb-1 pr-6 flex flex-wrap items-center gap-1.5 text-[11px] opacity-80">
            <span className="font-semibold">{msg.senderName}</span>

            {msg.sender?.department && (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-sm ${getDepartmentStyle(
                  msg.sender.department
                )}`}
              >
                {msg.sender.department}
              </span>
            )}

            <span>
              • {new Date(msg.createdAt).toLocaleString("pt-BR")}
            </span>

            {isMine && (
  <span className="ml-1 inline-flex items-center">
    {getMessageReadStatus(msg) === "sent" ? (
      <Check className="w-3.5 h-3.5 text-gray-400" />
    ) : getMessageReadStatus(msg) === "delivered" ? (
      <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
    ) : (
      <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
    )}
  </span>
)}
          </div>

          {msg.replyToMessage && (
  <button
    type="button"
    onClick={() => scrollToMessage(msg.replyToMessage!.id)}
    className="mb-2 block w-full rounded-lg border-l-4 border-green-500 bg-gray-50 px-3 py-2 text-left text-xs text-gray-800 transition hover:bg-gray-100"
  >
              <p className="font-semibold text-green-700">
                {msg.replyToMessage.senderName}
              </p>

              <p className="line-clamp-2 opacity-80">
                {msg.replyToMessage.message}
              </p>
            </button>
          )}

          {msg.media && msg.media.length > 0 && (
  <div className="mb-2 grid gap-2">
    {msg.media.map((item, index) => (
      <div
        key={item.id}
        className="overflow-hidden rounded-xl border border-gray-200"
      >
        {item.resourceType === "audio" ? (
          <div className="rounded-xl bg-gray-50 p-2">
            <AudioMessage url={item.mediaUrl} apiUrl={API_URL} />
          </div>
        ) : item.resourceType === "video" ? (
          <video
            src={item.mediaUrl}
            controls
            className="max-h-64 w-full object-cover bg-black"
          />
        ) : (
          <img
            src={item.mediaUrl.replace(
              "/upload/",
              "/upload/w_600,q_auto,f_auto/"
            )}
            alt="Mídia da mensagem"
            className="max-h-64 w-full cursor-pointer object-cover"
            onClick={() =>
              setExpandedMedia({
                items: (msg.media || []).map((media) => ({
                  mediaUrl: media.mediaUrl,
                  resourceType: media.resourceType,
                })),
                index,
              })
            }
          />
        )}
      </div>
    ))}
  </div>
)}

          {editingMessageId === msg.id ? (
            <div className="space-y-2">
              <Input
                value={editingMessageText}
                onChange={(e) => setEditingMessageText(e.target.value)}
                autoFocus
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingMessageId(null);
                    setEditingMessageText("");
                  }}
                >
                  Cancelar
                </Button>

                <Button type="button" size="sm" onClick={updateMessage}>
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap pr-4">{msg.message}</p>
          )}

          {messageMenuId === msg.id && (
            <div
  ref={messageMenuRef}
  className={`absolute z-40 top-8 ${
                isMine ? "right-2" : "left-2"
              } w-44 rounded-xl border border-border bg-card text-foreground shadow-xl overflow-hidden`}
            >
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(msg);
                  setMessageMenuId(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              >
                <Reply className="w-4 h-4" />
                Responder
              </button>

              {isMine && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMessageId(msg.id);
                      setEditingMessageText(msg.message);
                      setMessageMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      deleteMessage(msg.id);
                      setMessageMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Apagar
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  });
};

const getStatusStyle = (status: string) => {
  return statusColors[status] || "bg-gray-100 text-gray-700 border-gray-200";
};

const chatMedia = messages.flatMap((msg) =>
  (msg.media || []).map((media) => ({
    ...media,
    messageId: msg.id,
    senderName: msg.senderName,
    createdAt: msg.createdAt,
  }))
);

const renderNewTab = () => (
           <motion.form
  key="form"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{
    duration: 0.15,
    ease: "easeOut",
  }}
  onSubmit={handleSubmit}
  className="space-y-4 lg:max-w-2xl lg:mx-auto">
              {/* Image Upload */}
              <div>
                <input
  ref={fileInputRef}
  type="file"
 accept="image/*,video/*"
  multiple
  className="hidden"
  onChange={handleImageChange}
/>

                {imagePreviews.length > 0 ? (
  <div className="relative rounded-lg overflow-hidden">
    {selectedFiles[currentImageIndex]?.type.startsWith("video/") ? (
  <video
    src={imagePreviews[currentImageIndex]}
    controls
    preload="metadata"
    className="w-full h-48 object-cover rounded-lg bg-black"
  />
) : (
  <img
    src={imagePreviews[currentImageIndex]}
    alt="Preview"
    loading="lazy"
    decoding="async"
    className="w-full h-48 object-cover rounded-lg"
  />
)}

    {imagePreviews.length > 1 && (
      <>
        <button
          type="button"
          onClick={() =>
            setCurrentImageIndex((prev) =>
              prev === 0 ? imagePreviews.length - 1 : prev - 1
            )
          }
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={() =>
            setCurrentImageIndex((prev) =>
              prev === imagePreviews.length - 1 ? 0 : prev + 1
            )
          }
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
        >
          ›
        </button>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          {currentImageIndex + 1} / {imagePreviews.length}
        </div>
      </>
    )}

    <button
      type="button"
      onClick={() => {
        setImagePreviews([]);
        setSelectedFiles([]);
        setCurrentImageIndex(0);
      }}
      className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
    >
      ✕
    </button>
  </div>
) : (
  <button
    type="button"
    onClick={() => fileInputRef.current?.click()}
    className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-secondary hover:text-secondary transition-colors bg-muted/30"
  >
    <Camera className="w-10 h-10" />
    <span className="text-sm font-medium">Enviar Foto / Vídeo</span>
    <span className="text-xs">Obrigatório</span>
  </button>
)}
              </div>

              {/* Categories */}
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria *" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={String(category.id)}
                    >
                      <span className="flex items-center gap-2">
                        {categoryIcons[category.name] ||
                          categoryIcons["Outros"]}
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* GPS */}
              <div className="flex gap-2">
                <Button
  type="button"
  variant="outline"
  size="icon"
  onClick={getLocation}
  disabled={gettingLocation}
  title={
    gettingLocation
      ? "Obtendo localização..."
      : coords
      ? "Localização capturada"
      : "Capturar localização"
  }
  className={`shrink-0 transition-colors ${
    coords
      ? "border-green-500 text-green-600 hover:bg-green-50"
      : "border-red-300 text-red-500 hover:bg-red-50"
  }`}
>
  {gettingLocation ? (
    <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
  ) : (
    <MapPin className="w-4 h-4" />
  )}
</Button>

                <Input
  placeholder="Ponto de referência (ex: Galpão B)"
  value={referencePoint}
  onChange={(e) => setReferencePoint(e.target.value)}
  className="text-base"
/>
              </div>
              {address && (
  <Input
  placeholder="Endereço"
  value={address}
  onChange={(e) => setAddress(e.target.value)}
  className="text-base"
/>
)}

<Input
  placeholder="Nome do chamado *"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  className="text-base"
/>

              {/* Description */}
              <Textarea
  placeholder="Descrição breve (opcional)"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  rows={3}
  className="text-base"
/>

              {/* Submit */}
              <Button
  type="submit"
  disabled={submitting || geocoding}
  className="w-full h-14 text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
>
  <Send className="w-5 h-5 mr-2" />
  {submitting || geocoding ? (
    <span className="flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {geocoding ? "Buscando endereço..." : "Enviando chamado..."}
    </span>
  ) : (
    "Reportar Problema"
  )}
</Button>
            </motion.form>
);

const renderHistoryTab = () => (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0"
            >
               <div className="lg:col-span-3 mb-3 flex justify-end">
  <Button
    type="button"
    variant="outline"
    onClick={() => setShowFilters((prev) => !prev)}
    className={`rounded-full gap-2 transition-all ${
      showFilters ? "bg-secondary text-white border-secondary" : ""
    }`}
  >
    <Filter className="w-4 h-4" />
    Filtros
  </Button>
</div>

<AnimatePresence>
  {showFilters && (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="lg:col-span-3 mb-4 rounded-2xl border border-border bg-card p-4 shadow-lg"
    >
      <div className="space-y-3">
        <Input
          placeholder="Buscar por número, descrição, endereço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas situações</SelectItem>
              <SelectItem value="ABERTO">Aberto</SelectItem>
              <SelectItem value="EM_ANALISE">Em análise</SelectItem>
              <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
              <SelectItem value="FINALIZADO">Finalizado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  <span className="flex items-center gap-2">
                    {categoryIcons[category.name] || categoryIcons["Outros"]}
                    {category.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setCategoryFilter("all");
            }}
          >
            Limpar filtros
          </Button>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

              {filteredReports.length === 0 ? (
                <div className="lg:col-span-3 text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>
                    {myReports.length === 0
                      ? "Nenhum reporte ainda"
                      : "Nenhum chamado encontrado com esses filtros"}
                  </p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="relative bg-card rounded-lg p-4 border border-border"
                  >
                    <div className="mb-3 h-32 rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
                      {report.images?.[0]?.imageUrl ? (
                        report.images[0].resourceType === "video" ? (
                          <video
                            src={report.images[0].imageUrl}
                            controls
                            preload="metadata"
                            className="w-full h-32 object-cover bg-black"
                          />
                        ) : (
                          <img
                            src={report.images[0].imageUrl.replace(
                              "/upload/",
                              "/upload/w_500,q_auto,f_auto/"
                            )}
                            alt="Preview do chamado"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-32 object-cover"
                          />
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Sem mídia
                        </span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 space-y-1.5">
                        <span className="text-xs text-muted-foreground">
                          #{report.id}
                        </span>

                        <h3 className="font-semibold text-sm uppercase line-clamp-2">
                          {report.title || "Sem nome"}
                        </h3>

                         <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
  {categoryIcons[report.category.name] || categoryIcons["Outros"]}
  <span>{report.category.name}</span>
</div>

{report.employee?.name && (
  <p className="text-xs text-muted-foreground">
    Aberto por {report.employee.name}
  </p>
)}

                        <p className="text-xs text-muted-foreground">
  {new Date(report.createdAt).toLocaleDateString("pt-BR")}
  {report.referencePoint ? ` • ${report.referencePoint}` : ""}
</p>

{report._count?.messages ? (
  <p className="text-xs text-secondary font-medium">
    {report._count.messages} mensagem
    {report._count.messages > 1 ? "s" : ""}
  </p>
) : null}
                      </div>

                      <span
                        className={`shrink-0 text-xs px-2 py-1 rounded-full border ${
                          statusColors[report.status.name] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {report.status.name}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => openReportDetails(report)}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                ))
              )}
            </motion.div>
);

const renderReportsTab = () => (
            <motion.div
              key="reports"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0"
            >
            <div className="lg:col-span-3 mb-3 flex justify-end">
  <Button
    type="button"
    variant="outline"
    onClick={() => setShowFilters((prev) => !prev)}
    className={`rounded-full gap-2 transition-all ${
      showFilters ? "bg-secondary text-white border-secondary" : ""
    }`}
  >
    <Filter className="w-4 h-4" />
    Filtros
  </Button>
</div>

<AnimatePresence>
  {showFilters && (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="lg:col-span-3 mb-4 rounded-2xl border border-border bg-card p-4 shadow-lg"
    >
      <div className="space-y-3">
        <Input
          placeholder="Buscar por número, nome, descrição, autor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas situações</SelectItem>
              <SelectItem value="ABERTO">Aberto</SelectItem>
              <SelectItem value="EM_ANALISE">Em análise</SelectItem>
              <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
              <SelectItem value="FINALIZADO">Finalizado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  <span className="flex items-center gap-2">
                    {categoryIcons[category.name] || categoryIcons["Outros"]}
                    {category.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setCategoryFilter("all");
            }}
          >
            Limpar filtros
          </Button>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
              {filteredAllReports.length === 0 ? (
                <div className="lg:col-span-3 text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>
  {allReports.length === 0
    ? "Nenhum chamado compartilhado com você"
    : "Nenhum chamado encontrado com esses filtros"}
</p>
                </div>
              ) : (
               filteredAllReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-card rounded-lg p-4 border border-border"
                  >
                    <div className="mb-3 h-32 rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
                      {report.images?.[0]?.imageUrl ? (
                        report.images[0].resourceType === "video" ? (
                          <video
                            src={report.images[0].imageUrl}
                            controls
                            preload="metadata"
                            className="w-full h-32 object-cover bg-black"
                          />
                        ) : (
                          <img
                            src={report.images[0].imageUrl.replace(
                              "/upload/",
                              "/upload/w_500,q_auto,f_auto/"
                            )}
                            alt="Preview do chamado"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-32 object-cover"
                          />
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Sem mídia
                        </span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 space-y-1.5">
                        <span className="text-xs text-muted-foreground">
                          #{report.id}
                        </span>

                        <h3 className="font-semibold text-sm uppercase line-clamp-2">
  {report.title || "Sem nome"}
</h3>

{report.description && (
  <p className="text-xs text-muted-foreground line-clamp-2">
    {report.description}
  </p>
)}

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {categoryIcons[report.category.name] || categoryIcons["Outros"]}
                          <span>{report.category.name}</span>
                        </div>

                        {report.employee?.name && (
  <p className="text-xs text-muted-foreground">
    Aberto por {report.employee.name}
  </p>
)}

                        <p className="text-xs text-muted-foreground">
  {new Date(report.createdAt).toLocaleDateString("pt-BR")}
  {report.referencePoint ? ` • ${report.referencePoint}` : ""}
</p>

{report._count?.messages ? (
  <p className="text-xs text-secondary font-medium">
    {report._count.messages} mensagen
    {report._count.messages > 1 ? "s" : ""}
  </p>
) : null}
                      </div>

                      <span
                        className={`shrink-0 text-xs px-2 py-1 rounded-full border ${
                          statusColors[report.status.name] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {report.status.name}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => openReportDetails(report)}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                ))
              )}
            </motion.div>
);

  return (
      <div className="min-h-screen bg-background">
  <div className="mx-auto w-full max-w-lg lg:max-w-6xl lg:px-8"></div>
      {/* Header */}
     <header className="sticky top-0 z-[600] gradient-primary px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/logo-coopatos.png"
            alt="Logo Coopatos"
            className="w-20 h-20 rounded-xl"
          />
          <div>
            <h1 className="text-primary-foreground font-bold text-lg">
              Zeladoria Coopatos
            </h1>
            <p className="text-primary-foreground/60 text-xs">
                  {employeeName}
            </p>

            <p className="text-primary-foreground/50 text-[11px]">
                Matrícula: {matricula}
          </p>
          </div>
        </div>

        <button
  onClick={() => setShowLogoutConfirm(true)}
  className="text-red-400 hover:text-red-500 transition-colors"
  title="Sair"
>
  <LogOut className="w-5 h-5" />
</button>
      </header>

      {/* Tabs */}
<div className="sticky top-[104px] z-[500] flex border-b border-border bg-card shadow-sm pointer-events-auto">
        <button
  onClick={() => {
  setTab("new");
  setShowFilters(false);
  window.scrollTo(0, 0);
}}
  className={`relative flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
    tab === "new" ? "text-secondary" : "text-muted-foreground"
  }`}
>
  <Plus className="w-4 h-4" /> Novo Chamado

  {tab === "new" && (
    <motion.span
      layoutId="activeTab"
      className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary"
      transition={{ type: "spring", stiffness: 450, damping: 35 }}
    />
  )}
</button>

        <button
  onClick={() => {
  setTab("history");
  setShowFilters(false);
  window.scrollTo(0, 0);
}}
  className={`relative flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
    tab === "history" ? "text-secondary" : "text-muted-foreground"
  }`}
>
  <List className="w-4 h-4" /> Meus Reportes ({myReports.length})

  {tab === "history" && (
    <motion.span
      layoutId="activeTab"
      className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary"
      transition={{ type: "spring", stiffness: 450, damping: 35 }}
    />
  )}
</button>
        <button
  onClick={() => {
  setTab("reports");
  setShowFilters(false);
  window.scrollTo(0, 0);
}}
  className={`relative flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
    tab === "reports" ? "text-secondary" : "text-muted-foreground"
  }`}
>
  <List className="w-4 h-4" />
  Reportes ({allReports.length})

  {tab === "reports" && (
    <motion.span
      layoutId="activeTab"
      className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary"
      transition={{ type: "spring", stiffness: 450, damping: 35 }}
    />
  )}
</button>
      </div>

      {/* Content */}
     <div
  ref={tabsContainerRef}
  className="flex-1 overflow-hidden"
>
        {isMobileTabs ? (
  <motion.div
    className="flex w-full touch-pan-y"
    style={{ x: tabX }}
    drag="x"
    dragElastic={0.05}
    dragMomentum={false}
    dragConstraints={{
  left: -tabsContainerWidth * 2,
  right: 0,
}}
    onDragEnd={handleTabDragEnd}
  >
    <div className="w-full min-w-full shrink-0 p-4">
      {renderNewTab()}
    </div>

    <div className="w-full min-w-full shrink-0 p-4">
      {renderHistoryTab()}
    </div>

    <div className="w-full min-w-full shrink-0 p-4">
      {renderReportsTab()}
    </div>
  </motion.div>
) : (
  <div className="p-4 lg:py-8">
    <AnimatePresence mode="wait" initial={false}>
      {tab === "new"
        ? renderNewTab()
        : tab === "history"
        ? renderHistoryTab()
        : renderReportsTab()}
    </AnimatePresence>
  </div>
)}

        <AnimatePresence>
  {selectedReport && (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4"
      onClick={() => setSelectedReport(null)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.75, y: 40 }}
        transition={{ duration: 0.18, ease: "easeInOut" }}
        className="relative z-[2001] bg-card rounded-2xl p-5 w-full max-w-lg lg:max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-border"
      >
      <button
  type="button"
  onClick={() => setSelectedReport(null)}
  className="sticky top-0 ml-auto z-20 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
>
  <X className="w-4 h-4" />
</button>
     <div className="mb-5">
  <p className="text-xs text-muted-foreground">Detalhes do chamado</p>
  <h2 className="text-xl font-bold text-foreground">
    Chamado #{selectedReport.id}
  </h2>
</div>

     {selectedReport.images && selectedReport.images.length > 0 && (
  <>
    <div className="relative mb-4 rounded-lg overflow-hidden">
      {selectedReport.images[detailImageIndex].resourceType === "video" ? (
        <video
          src={selectedReport.images[detailImageIndex].imageUrl}
          controls
          preload="metadata"
          className="w-full h-64 lg:h-96 object-cover rounded-lg bg-black"
        />
      ) : (
        <img
          src={selectedReport.images[detailImageIndex].imageUrl.replace(
            "/upload/",
            "/upload/w_900,q_auto,f_auto/"
          )}
          alt="Imagem do chamado"
          loading="lazy"
          decoding="async"
          className="w-full h-64 lg:h-96 object-cover rounded-lg"
        />
)}
<button
  type="button"
  onClick={() =>
    setExpandedMedia({
      items: (selectedReport.images || []).map((image) => ({
        mediaUrl: image.imageUrl,
        resourceType: image.resourceType,
      })),
      index: detailImageIndex,
    })
  }
  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
>
  <Expand className="w-4 h-4" />
</button>
      {selectedReport.images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setDetailImageIndex((prev) =>
                prev === 0
                  ? selectedReport.images!.length - 1
                  : prev - 1
              )
            }
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() =>
              setDetailImageIndex((prev) =>
                prev === selectedReport.images!.length - 1
                  ? 0
                  : prev + 1
              )
            }
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >
            ›
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {detailImageIndex + 1} / {selectedReport.images.length}
          </div>
        </>
      )}
    </div>

    {isEditing && (
  <div className="mb-4 space-y-2">
    {selectedReport.images?.[detailImageIndex] && (
      <Button
        variant="outline"
        size="sm"
        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={async () => {
          const imageId =
            selectedReport.images![detailImageIndex].id;

          await fetch(`${API_URL}/report-images/${imageId}`, {
            method: "DELETE",
          });

          const updatedImages =
            selectedReport.images!.filter(
              (img) => img.id !== imageId
            );

          const updatedReport = {
            ...selectedReport,
            images: updatedImages,
          };

          setSelectedReport(updatedReport);

          setMyReports((prev) =>
            prev.map((report) =>
              report.id === selectedReport.id
                ? updatedReport
                : report
            )
          );
          setAllReports((prev) =>
  prev.map((report) =>
    report.id === selectedReport.id
      ? updatedReport
      : report
  )
);

          setDetailImageIndex(0);
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <Trash2 className="w-4 h-4" />
          Remover mídia
        </span>
      </Button>
    )}

    <label
      htmlFor="edit-images-input"
      className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 cursor-pointer transition-colors hover:bg-green-100"
    >
      <Plus className="w-4 h-4" />
      Adicionar mídia
    </label>
  </div>
)}
     
  </>
)}
      <div className="mb-4">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
  Categoria
</label>

        {isEditing ? (
          <Select
            value={editCategoryId}
            onValueChange={setEditCategoryId}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
  <SelectItem key={category.id} value={String(category.id)}>
    <span className="flex items-center gap-2">
      {categoryIcons[category.name] || categoryIcons["Outros"]}
      {category.name}
    </span>
  </SelectItem>
))}
            </SelectContent>
          </Select>
        ) : (
          <p>{selectedReport.category.name}</p>
        )}
      </div>

<div className="mb-4">
  <label className="text-sm font-medium">Nome do chamado</label>

  {isEditing ? (
    <Input
      value={editTitle}
      onChange={(e) => setEditTitle(e.target.value)}
    />
  ) : (
    <p>{selectedReport.title || "Sem nome"}</p>
  )}
</div>
      <div className="mb-4">
        <label className="text-sm font-medium">Descrição</label>

        {isEditing ? (
          <Textarea
            value={editDescription}
            onChange={(e) =>
              setEditDescription(e.target.value)
            }
          />
        ) : (
          <p>{selectedReport.description || "Sem descrição"}</p>
        )}
      </div>

      <div className="mb-4">
  <label className="text-sm font-medium">Ponto de referência</label>

  {isEditing ? (
    <Input
      value={editReferencePoint}
      onChange={(e) => setEditReferencePoint(e.target.value)}
    />
  ) : (
    <p>{selectedReport.referencePoint || "Não informado"}</p>
  )}
</div>

<div className="mb-4">
  <label className="text-sm font-medium">Endereço</label>

  {isEditing ? (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
  <Button
    type="button"
    variant="outline"
    size="icon"
    onClick={getEditLocation}
    disabled={gettingLocation}
    title={
      gettingLocation
        ? "Obtendo localização..."
        : editCoords
        ? "Localização atualizada"
        : "Atualizar localização"
    }
    className={`shrink-0 transition-colors ${
      editCoords
        ? "border-green-500 text-green-600 hover:bg-green-50"
        : "border-red-300 text-red-500 hover:bg-red-50"
    }`}
  >
    {gettingLocation ? (
      <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
    ) : (
      <MapPin className="w-4 h-4" />
    )}
  </Button>

  <span className="text-sm text-muted-foreground">
    {editCoords
      ? "Localização capturada"
      : "Atualizar localização"}
  </span>
</div>

      <Input
        value={editAddress}
        onChange={(e) => setEditAddress(e.target.value)}
        placeholder="Endereço do chamado"
      />

      {editCoords && (
        <p className="text-xs text-muted-foreground">
          Lat: {editCoords.lat.toFixed(6)} | Lng:{" "}
          {editCoords.lng.toFixed(6)}
        </p>
      )}
    </div>
  ) : (
    <p>{selectedReport.address || "Não informado"}</p>
  )}
</div>

<div className="mb-4">
  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
    Situação
  </label>

  <div className="mt-1">
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
        selectedReport.status.name
      )}`}
    >
      {selectedReport.status.name}
    </span>
  </div>
</div>

{isEditing && (
  <div className="mb-4">
    <Input
      type="file"
      accept="image/*,video/*"
      multiple
      className="hidden"
      id="edit-images-input"
      onChange={async (e) => {
        const files = Array.from(e.target.files || []);
        const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);

if (oversizedFile) {
  toast({
    title: "Arquivo muito grande",
    description: "Cada arquivo deve ter no máximo 100 MB.",
    variant: "destructive",
  });

  e.target.value = "";
  return;
}

        if (files.length === 0 || !selectedReport) return;

        try {
          const mediaItems = await Promise.all(
  files.map((file) => uploadImageToCloudinary(file))
);

          const response = await fetch(
            `${API_URL}/reports/${selectedReport.id}/images`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ mediaItems }),
            }
          );

          const updatedReport = await response.json();

          setSelectedReport(updatedReport);

          setMyReports((prev) =>
            prev.map((report) =>
              report.id === updatedReport.id ? updatedReport : report
            )
          );

          setAllReports((prev) =>
  prev.map((report) =>
    report.id === updatedReport.id ? updatedReport : report
  )
);

          setDetailImageIndex(
            updatedReport.images.length - mediaItems.length
          );

          toast({
            title: "Imagens adicionadas com sucesso!",
          });
        } catch (error) {
          console.error(error);

          toast({
            title: "Erro ao adicionar imagens",
            variant: "destructive",
          });
        }
      }}
     />

  </div>
)}

<div className="mt-6 border-t border-border pt-4">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-semibold">Participantes</h3>

    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={openParticipantModal}
      className="h-8 gap-1"
    >
      <Plus className="w-3.5 h-3.5" />
      Adicionar
    </Button>
  </div>

  <div className="flex flex-wrap gap-2">
    {selectedReport.participants?.length ? (
      selectedReport.participants.map((participant) => (
        <span
  key={participant.id}
  className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
>
  <span>
    {participant.employee.name}
    {participant.role === "OWNER" ? " • Criador" : ""}
  </span>

  {selectedReport.employee?.id === employee.id &&
    participant.role !== "OWNER" && (
      <button
        type="button"
        onClick={() => removeParticipant(participant.id)}
        className="text-red-600 hover:text-red-700"
        title="Remover participante"
      >
        <X className="w-3 h-3" />
      </button>
    )}
</span>
      ))
    ) : (
      <p className="text-xs text-muted-foreground">
        Nenhum participante listado.
      </p>
    )}
  </div>
</div>

<div className="mt-6 border-t border-border pt-4">
  <button
    type="button"
    onClick={async () => {
  setShowMessagesModal(true);
  setNewMessagesCount(0);
  setIsNearBottom(true);
  isNearBottomRef.current = true;
  lastMessageIdRef.current = null;
  hasOpenedChatRef.current = true;

  await loadMessages(selectedReport!.id);
  markMessagesAsRead(selectedReport!.id);

  setTimeout(() => {
    jumpMessagesToBottom();
  }, 50);
}}
    className="relative flex w-full items-center gap-3 rounded-2xl border border-secondary/30 bg-secondary/10 p-4 text-left transition hover:bg-secondary/15"
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-sm">
      <MessageCircle className="w-6 h-6" />
    </div>

    <div className="min-w-0">
      <p className="text-sm font-semibold text-foreground">
        Conversas
      </p>
      <p className="text-xs text-muted-foreground">
        Acompanhe mensagens e respostas do chamado
      </p>
    </div>

    {selectedReport && unreadCounts[selectedReport.id] > 0 && (
      <span className="absolute -right-2 -top-2 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-600 px-2 text-xs font-bold text-white">
       {unreadCounts[selectedReport.id]}
      </span>
    )}
  </button>
</div>

<div className="flex gap-2 mt-6">
  {isEditing ? (
    <>
     <Button
  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
  onClick={handleUpdateReport}
  disabled={savingEdit || geocoding}
>
  {savingEdit || geocoding ? (
    <span className="flex items-center gap-2">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {geocoding ? "Buscando endereço..." : "Salvando..."}
    </span>
  ) : (
    "Salvar"
  )}
</Button>

      <Button
        variant="outline"
        className="flex-1 bg-red-600 hover:bg-red-500 text-white"
        onClick={() => setIsEditing(false)}
      >
        Cancelar
      </Button>
    </>
  ) : (
    <>
      <Button className="flex-1" onClick={() => setIsEditing(true)}>
        Editar
      </Button>

    </>
  )}
</div>
          </motion.div>
    </motion.div>
  )}
</AnimatePresence>

{showParticipantModal && (
  <div
    className="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4"
    onClick={() => setShowParticipantModal(false)}
  >
    <div
      className="bg-card rounded-2xl p-5 w-full max-w-md shadow-2xl border border-border"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            Adicionar participante
          </h3>
          <p className="text-sm text-muted-foreground">
            Pesquise por nome, matrícula ou departamento.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowParticipantModal(false)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <Input
        value={employeeSearch}
        onChange={(e) => setEmployeeSearch(e.target.value)}
        placeholder="Buscar funcionário..."
        className="mb-3"
      />

      <div className="max-h-72 overflow-y-auto space-y-2">
        {filteredEmployees.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum funcionário encontrado.
          </p>
        ) : (
          filteredEmployees.map((emp) => (
            <button
              key={emp.id}
              type="button"
              disabled={addingParticipant}
              onClick={() => addParticipant(emp.id)}
              className="w-full rounded-lg border border-border p-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-60"
            >
              <p className="text-sm font-medium">{emp.name}</p>
              <p className="text-xs text-muted-foreground">
                Matrícula: {emp.registrationNumber}
                {emp.department ? ` • ${emp.department}` : ""}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  </div>
)}

<AnimatePresence>
  {showMessagesModal && selectedReport && (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowMessagesModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.75, y: 40 }}
        transition={{ duration: 0.18, ease: "easeInOut" }}
        className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden"
      >
      {/* Header */}
   {/* Header */}
<div className="border-b border-border px-5 py-4 sm:px-6">
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0 pl-1 sm:pl-2">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
        Conversas do chamado #{selectedReport.id}
      </h2>

      

      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
        {selectedReport.title || selectedReport.description}
      </p>
    </div>

    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => setShowMessageSearch((prev) => !prev)}
        className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border transition-all ${
          showMessageSearch
            ? "bg-secondary text-white border-secondary shadow-md"
            : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
        }`}
      >
        <Search
          className={`h-5 w-5 transition-transform duration-300 ${
            showMessageSearch ? "rotate-90 scale-110" : ""
          }`}
        />
      </button>

      <button
  type="button"
  onClick={() => setShowChatMediaModal(true)}
  className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border bg-muted text-muted-foreground border-border hover:bg-muted/80"
>
  <Images className="h-5 w-5" />

  {chatMedia.length > 0 && (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-white">
      {chatMedia.length}
    </span>
  )}
</button>

      <button
        type="button"
        onClick={() => setShowMessagesModal(false)}
        className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-red-50 text-red-600 transition-all hover:scale-105 hover:bg-red-100"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  </div>

  {showMessageSearch && (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="mt-4 rounded-2xl border border-border bg-muted/20 p-3"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={messageSearchTerm}
          onChange={(e) => {
            setMessageSearchTerm(e.target.value);
            setCurrentSearchIndex(0);
          }}
          placeholder="Pesquisar mensagens..."
          className="h-11"
          autoFocus
        />

        <Button
          type="button"
          disabled={messageSearchResults.length === 0}
          onClick={() => goToSearchResult(currentSearchIndex)}
          className="h-11 shrink-0"
        >
          Buscar
        </Button>
      </div>

      

      {messageSearchTerm && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {messageSearchResults.length} resultado
            {messageSearchResults.length !== 1 ? "s" : ""}
          </span>

          {messageSearchResults.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const nextIndex =
                    currentSearchIndex === 0
                      ? messageSearchResults.length - 1
                      : currentSearchIndex - 1;

                  goToSearchResult(nextIndex);
                }}
                className="hover:text-foreground"
              >
                Anterior
              </button>

              <span>
                {currentSearchIndex + 1} de {messageSearchResults.length}
              </span>

              <button
                type="button"
                onClick={() => {
                  const nextIndex =
                    currentSearchIndex === messageSearchResults.length - 1
                      ? 0
                      : currentSearchIndex + 1;

                  goToSearchResult(nextIndex);
                }}
                className="hover:text-foreground"
              >
                Próximo
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )}
</div>


      {/* Messages */}
      <div
  ref={messagesContainerRef}
  onScroll={handleMessagesScroll}
  className="flex-1 overflow-y-auto p-4 space-y-3"
>
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhuma mensagem ainda.
          </p>
        ) : (
          renderMessages()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyingTo && (
        <div className="mx-4 mb-3 rounded-xl border-l-4 border-secondary bg-muted/40 p-3">
          <div className="flex justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-secondary">
                Respondendo {replyingTo.senderName}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {replyingTo.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {typingUsers.length > 0 && (
  <p className="px-4 pb-2 text-xs text-muted-foreground italic">
    {typingUsers.length === 1
      ? `${typingUsers[0].employeeName} está digitando...`
      : `${typingUsers
          .map((user) => user.employeeName)
          .join(", ")} estão digitando...`}
  </p>
)}

{newMessagesCount > 0 && !isNearBottom && (
  <button
    type="button"
    onClick={() => {
      scrollMessagesToBottom();
      setNewMessagesCount(0);
      setIsNearBottom(true);
      isNearBottomRef.current = true;

      if (selectedReport) {
        markMessagesAsRead(selectedReport.id);
      }
    }}
    className="absolute bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-white shadow-xl transition-all hover:scale-105"
  >
    ↓ {newMessagesCount} nova{newMessagesCount > 1 ? "s" : ""}
  </button>
)}

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <input
  ref={chatFileInputRef}
  type="file"
  accept="image/*,video/*,audio/*"
  multiple
  className="hidden"
  onChange={(e) => {
    const files = Array.from(e.target.files || []);

    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);

    if (oversizedFile) {
      toast({
        title: "Arquivo muito grande",
        description: "Cada arquivo deve ter no máximo 100 MB.",
        variant: "destructive",
      });

      e.target.value = "";
      return;
    }

    setChatFiles(files);
  }}
/>

<div ref={emojiPickerRef} className="relative">
  <Button
    type="button"
    variant="outline"
    size="icon"
    onClick={() => setShowEmojiPicker((prev) => !prev)}
  >
    <Smile className="w-5 h-5" />
  </Button>

  {showEmojiPicker && (
    <div className="absolute bottom-14 left-0 z-[9999]">
      <EmojiPicker
        onEmojiClick={(emojiData) => {
          setNewMessage((prev) => prev + emojiData.emoji);
        }}
        theme={Theme.LIGHT}
        lazyLoadEmojis
      />
    </div>
  )}
</div>

<Button
  type="button"
  variant="outline"
  size="icon"
  onClick={() => chatFileInputRef.current?.click()}
  className={chatFiles.length > 0 ? "border-secondary text-secondary" : ""}
  title="Anexar mídia"
>
  <Camera className="w-4 h-4" />
</Button>

<Button
  type="button"
  variant="outline"
  size="icon"
  onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
  className={isRecordingAudio ? "border-red-500 text-red-600 animate-pulse" : ""}
  title={isRecordingAudio ? "Parar gravação" : "Gravar áudio"}
>
  {isRecordingAudio ? (
    <Square className="w-4 h-4" />
  ) : (
    <Mic className="w-4 h-4" />
  )}
</Button>
          <Input
            value={newMessage}
            onChange={(e) => {
  setNewMessage(e.target.value);
  sendTypingSignal();
}}
            placeholder="Escreva uma mensagem..."
            onKeyDown={(e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    if (
      e.repeat ||
      sendingMessageRef.current ||
      sendingMessage ||
      isRecordingAudio
    ) {
      return;
    }

    sendMessage();
  }
}}
          />

          <Button
            type="button"
            onClick={sendMessage}
            disabled={
              sendingMessage ||
              isRecordingAudio ||
              (!newMessage.trim() && chatFiles.length === 0)
            }
          >
            Enviar
          </Button>
        </div>
      </div>
         </motion.div>
    </motion.div>
  )}
</AnimatePresence>

<AnimatePresence>
  {expandedMedia && (
    <motion.div
      className="fixed inset-0 z-[12000] bg-black/90 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        onClick={() => setExpandedMedia(null)}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>
      <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    const currentMedia = expandedMedia.items[expandedMedia.index];

    if (currentMedia?.mediaUrl) {
      downloadMedia(currentMedia.mediaUrl);
    }
  }}
  className="absolute top-4 right-16 bg-black/60 hover:bg-black/80 text-white rounded-full px-4 h-10 flex items-center justify-center text-sm"
>
  Baixar
</button>

      {expandedMedia.items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setExpandedMedia((prev) =>
                prev
                  ? {
                      ...prev,
                      index:
                        prev.index === 0
                          ? prev.items.length - 1
                          : prev.index - 1,
                    }
                  : prev
              )
            }
            className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white hover:bg-white/20"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() =>
              setExpandedMedia((prev) =>
                prev
                  ? {
                      ...prev,
                      index:
                        prev.index === prev.items.length - 1
                          ? 0
                          : prev.index + 1,
                    }
                  : prev
              )
            }
            className="
absolute
right-2
sm:right-4
top-1/2
-ztranslate-y-1/2
z-[10001]
bg-black/70
text-white
rounded-full
w-12
h-12
sm:w-10
sm:h-10
flex
items-center
justify-center
text-3xl
touch-manipulation
"
          >
            ›
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
            {expandedMedia.index + 1} / {expandedMedia.items.length}
          </div>
        </>
      )}

      {expandedMedia.items[expandedMedia.index]?.resourceType === "audio" ? (
        <div
          className="w-full max-w-md rounded-2xl bg-white p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <audio
            src={expandedMedia.items[expandedMedia.index]?.mediaUrl}
            controls
            autoPlay
            className="w-[260px] max-w-full block"
          />
        </div>
      ) : expandedMedia.items[expandedMedia.index]?.resourceType === "video" ? (
        <video
          src={expandedMedia.items[expandedMedia.index]?.mediaUrl}
          controls
          autoPlay
          className="max-h-[85vh] max-w-full rounded-xl bg-black"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={expandedMedia.items[expandedMedia.index]?.mediaUrl}
          alt="Mídia ampliada"
          className="max-h-[85vh] max-w-full rounded-xl object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </motion.div>
  )}
</AnimatePresence>

<AnimatePresence>
  {showChatMediaModal && (
    <motion.div
      className="fixed inset-0 z-[11000] bg-black/60 flex items-center justify-center p-4"
      onClick={() => setShowChatMediaModal(false)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
  initial={{ opacity: 0, scale: 0.92 }}
  onClick={(e) => e.stopPropagation()}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl bg-card shadow-2xl border border-border flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="text-lg font-bold">Mídias da conversa</h2>
            <p className="text-sm text-muted-foreground">
              {chatMedia.length} arquivo{chatMedia.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowChatMediaModal(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {chatMedia.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma mídia enviada nesta conversa.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {chatMedia.map((item, index) => (
                <div
                  key={`${item.messageId}-${item.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setExpandedMedia({
                      items: chatMedia.map((media) => ({
                        mediaUrl: media.mediaUrl,
                        resourceType: media.resourceType,
                      })),
                      index,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setExpandedMedia({
                        items: chatMedia.map((media) => ({
                          mediaUrl: media.mediaUrl,
                          resourceType: media.resourceType,
                        })),
                        index,
                      });
                    }
                  }}
                  className="cursor-pointer overflow-hidden rounded-xl border border-border bg-muted text-left"
                >
                  {item.resourceType === "audio" ? (
                    <div className="w-[260px] max-w-full overflow-hidden rounded-xl bg-gray-50">
                      <AudioMessage url={item.mediaUrl} apiUrl={API_URL} />
                    </div>
                  ) : item.resourceType === "video" ? (
                    <video
                      src={item.mediaUrl}
                      className="h-32 w-full object-cover bg-black"
                    />
                  ) : (
                    <img
                      src={item.mediaUrl.replace(
                        "/upload/",
                        "/upload/w_400,q_auto,f_auto/"
                      )}
                      alt="Mídia da conversa"
                      className="h-32 w-full object-cover"
                    />
                  )}

                  <div className="p-2">
                    <p className="truncate text-xs font-medium">
                      {item.senderName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

<div className="fixed bottom-5 right-5 z-[9000]">
  <AnimatePresence>
    {showQuickMenu && (
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.95 }}
        className="mb-3 space-y-2"
      >
        <button
          type="button"
          onClick={() => {
            setShowNotificationsPanel(true);
            setShowQuickMenu(false);
          }}
          className="relative flex w-48 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-lg"
        >
          <Bell className="h-4 w-4" />
          Notificações

          {unreadNotificationsCount > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
  setShowTeamPanel(true);
  setShowQuickMenu(false);
  loadTeamEmployees();
}}
          className="flex w-48 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-lg"
        >
          <Users className="h-4 w-4" />
          Equipe
        </button>
      </motion.div>
    )}
  </AnimatePresence>

  <button
    type="button"
    onClick={() => setShowQuickMenu((prev) => !prev)}
    className="relative flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-white shadow-2xl"
  >
    <Plus
      className={`h-7 w-7 transition-transform ${
        showQuickMenu ? "rotate-45" : ""
      }`}
    />

    {unreadNotificationsCount > 0 && (
      <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
        {unreadNotificationsCount}
      </span>
    )}
  </button>
</div>

<AnimatePresence>
  {showNotificationsPanel && (
    <motion.div
      className="fixed inset-0 z-[9100] bg-black/50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowNotificationsPanel(false)}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[80vh] overflow-hidden rounded-3xl bg-card shadow-2xl border border-border flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="text-lg font-bold">Notificações</h2>
            <p className="text-xs text-muted-foreground">
              {unreadNotificationsCount} não lida
              {unreadNotificationsCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="text-xs font-medium text-secondary hover:underline"
              >
                Marcar todas
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowNotificationsPanel(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-3">
          {notifications.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma notificação ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    notification.readAt
                      ? "border-border bg-muted/30"
                      : "border-secondary/40 bg-secondary/10"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-2.5 w-2.5 rounded-full ${
                        notification.readAt
                          ? "bg-muted-foreground/40"
                          : "bg-red-500"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {notification.title}
                      </p>

                      {notification.body && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {notification.body}
                        </p>
                      )}

                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString(
                          "pt-BR"
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

<AnimatePresence>
  {showTeamPanel && (
    <motion.div
      className="fixed inset-0 z-[9100] bg-black/50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowTeamPanel(false)}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[80vh] overflow-hidden rounded-3xl bg-card shadow-2xl border border-border flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="text-lg font-bold">Equipe</h2>
            <p className="text-xs text-muted-foreground">
              {filteredTeamEmployees.length} funcionário
              {filteredTeamEmployees.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowTeamPanel(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-border p-3 space-y-2">
          <Input
            value={teamSearch}
            onChange={(e) => setTeamSearch(e.target.value)}
            placeholder="Buscar por nome, matrícula ou setor..."
            className="h-10"
          />

          <Select
            value={teamDepartmentFilter}
            onValueChange={setTeamDepartmentFilter}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Filtrar por departamento" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>

              {teamDepartments.map((department) => (
                <SelectItem key={department} value={department!}>
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-y-auto p-3">
          {filteredTeamEmployees.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum funcionário encontrado.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredTeamEmployees.map((emp) => {
                const isOnline = onlineEmployeeIds.includes(emp.id);

                return (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`h-3 w-3 shrink-0 rounded-full ${
                          isOnline ? "bg-green-500" : "bg-red-500"
                        }`}
                        title={isOnline ? "Online" : "Offline"}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {emp.name}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {emp.department || "Sem departamento"} • Matrícula{" "}
                          {emp.registrationNumber}
                        </p>
                      </div>
                    </div>

                    <Button
  type="button"
  size="sm"
  variant="outline"
  className="h-8 shrink-0"
  onClick={() => openPrivateConversation(emp.id)}
  disabled={emp.id === employee.id}
>
  Conversar
</Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

<AnimatePresence>
  {showPrivateChatModal && privateConversation && (
    <motion.div
      className="fixed inset-0 z-[9200] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={closePrivateChat}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg h-[100dvh] sm:h-[75vh] max-h-[100dvh] rounded-none sm:rounded-3xl bg-card shadow-2xl border border-border flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
  <div>
    <h2 className="text-base font-bold">
      {getPrivateChatTitle()}
    </h2>
    <p className="text-xs text-muted-foreground">
      Conversa particular
    </p>
  </div>

<div className="flex items-center gap-2">
  <button
    type="button"
    onClick={() => setShowPrivateMessageSearch((prev) => !prev)}
    className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
  >
    <Search className="h-4 w-4" />
  </button>

  <button
    type="button"
    onClick={closePrivateChat}
    className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"
  >
    <X className="h-5 w-5" />
  </button>
</div>

        
        </div>

        {showPrivateMessageSearch && (
  <div className="border-b border-border bg-card p-3">
    <div className="flex items-center gap-2">
      <Input
        value={privateMessageSearchTerm}
        onChange={(e) => {
          setPrivateMessageSearchTerm(e.target.value);
          setCurrentPrivateSearchIndex(0);
        }}
        placeholder="Buscar mensagem..."
        className="h-9 text-sm"
      />

      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={privateMessageSearchResults.length === 0}
        onClick={() => {
          const nextIndex =
            currentPrivateSearchIndex <= 0
              ? privateMessageSearchResults.length - 1
              : currentPrivateSearchIndex - 1;

          goToPrivateSearchResult(nextIndex);
        }}
      >
        ↑
      </Button>

      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={privateMessageSearchResults.length === 0}
        onClick={() => {
          const nextIndex =
            currentPrivateSearchIndex >= privateMessageSearchResults.length - 1
              ? 0
              : currentPrivateSearchIndex + 1;

          goToPrivateSearchResult(nextIndex);
        }}
      >
        ↓
      </Button>

      <span className="min-w-[54px] text-center text-xs text-muted-foreground">
        {privateMessageSearchTerm
          ? `${privateMessageSearchResults.length ? currentPrivateSearchIndex + 1 : 0}/${privateMessageSearchResults.length}`
          : "0/0"}
      </span>
    </div>
  </div>
)}

        <div
  ref={privateMessagesContainerRef}
  className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/30 p-3 space-y-2 touch-pan-y"
>
          {loadingPrivateMessages ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando conversa...
            </p>
          ) : privateMessages.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma mensagem ainda.
            </p>
          ) : (
           privateMessages.map((msg) => {
            
  const isMine = msg.senderId === employee.id;
  const isEditingThisMessage = editingPrivateMessageId === msg.id;

  return (
    <div
  key={msg.id}
  ref={(el) => {
    privateMessageRefs.current[msg.id] = el;
  }}
  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
>
      <div className="relative group max-w-[82%]">
        <button
  type="button"
  onPointerDown={(e) => e.stopPropagation()}
  onClick={() => {
    setPrivateMessageMenuId(
      privateMessageMenuId === msg.id ? null : msg.id
    );
  }}
  className={`absolute top-1 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:bg-gray-100 ${
    isMine ? "right-1" : "right-1"
  }`}
>
  <ChevronDown className="h-4 w-4" />
</button>

        {privateMessageMenuId === msg.id && (
  <div
  onPointerDown={(e) => e.stopPropagation()}
  className={`absolute top-10 z-30 w-40 overflow-hidden rounded-xl border border-border bg-white shadow-xl ${
    isMine ? "right-0" : "right-0"
  }`}
>
            <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    setReplyingToPrivateMessage(msg);
    setPrivateMessageMenuId(null);
  }}
  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
>
  <Reply className="h-3.5 w-3.5" />
  Responder
</button>

            {isMine && msg.message?.trim() && (
              <button
                type="button"
                onClick={() => {
                  setEditingPrivateMessageId(msg.id);
                  setEditingPrivateMessageText(msg.message);
                  setPrivateMessageMenuId(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
            )}

            {isMine && (
              <button
                type="button"
                onClick={() => deletePrivateMessage(msg.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </button>
            )}
          </div>
        )}

        <div
          className={`min-w-[170px] rounded-2xl px-3 py-2 pr-10 text-sm shadow-sm border ${
            isMine
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-white text-gray-900 border-gray-200"
          }`}
        >
          {!isMine && (
            <p className="mb-1 text-[11px] font-semibold opacity-70">
              {msg.sender?.name}
            </p>
          )}

          {msg.replyToMessage && (
  <button
    type="button"
    onPointerDown={(e) => e.stopPropagation()}
    onClick={(e) => {
      e.stopPropagation();
      scrollToPrivateMessage(msg.replyToMessage!.id);
    }}
    className="mb-2 w-full rounded-lg border-l-4 border-green-200 bg-white/50 px-2 py-1 text-left text-xs"
  >

    <p className="truncate text-gray-600">
      {msg.replyToMessage.message || "Mídia"}
    </p>
  </button>
)}

          

          {msg.media && msg.media.length > 0 && (
            <div className="mb-2 grid gap-2">
              {msg.media.map((item, index) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-gray-200"
                >
                  {item.resourceType === "audio" ? (
                    <div className="w-[260px] max-w-full overflow-hidden rounded-xl bg-gray-50">
                      <AudioMessage url={item.mediaUrl} apiUrl={API_URL} />
                    </div>
                  ) : item.resourceType === "video" ? (
                    <video
                      src={item.mediaUrl}
                      controls
                      className="max-h-64 w-full object-cover bg-black"
                    />
                  ) : (
                    <img
                      src={item.mediaUrl.replace(
                        "/upload/",
                        "/upload/w_600,q_auto,f_auto/"
                      )}
                      alt="Mídia da conversa"
                      className="max-h-64 w-full cursor-pointer object-cover"
                      onClick={() =>
                        setExpandedMedia({
                          items: (msg.media || []).map((media) => ({
                            mediaUrl: media.mediaUrl,
                            resourceType: media.resourceType,
                          })),
                          index,
                        })
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}


          {isEditingThisMessage ? (
            <div className="space-y-2">
              <Textarea
                value={editingPrivateMessageText}
                onChange={(e) =>
                  setEditingPrivateMessageText(e.target.value)
                }
                className="min-h-[70px] bg-white text-gray-900"
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingPrivateMessageId(null);
                    setEditingPrivateMessageText("");
                  }}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={updatePrivateMessage}
                >
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            msg.message?.trim() && (
              <p className="whitespace-pre-wrap pr-1">
                {msg.message}
              </p>
            )
          )}

          <p className="mt-1 text-[10px] opacity-60 text-right">
            {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
})

          )}


<div ref={privateMessagesEndRef} />
        </div>

       <div className="shrink-0 border-t border-border bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">

        <input
  ref={privateChatFileInputRef}
  type="file"
  accept="image/*,video/*,audio/*"
  multiple
  className="hidden"
  onChange={(e) => {
    const files = Array.from(e.target.files || []);

    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);

    if (oversizedFile) {
      toast({
        title: "Arquivo muito grande",
        description: "Cada arquivo deve ter no máximo 100 MB.",
        variant: "destructive",
      });

      e.target.value = "";
      return;
    }

    setPrivateChatFiles(files);
  }}
/>

        {privateChatFiles.length > 0 && (
  <div className="mb-2 flex flex-wrap gap-2">
    {privateChatFiles.map((file, index) => (
      <div
        key={`${file.name}-${index}`}
        className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs"
      >
        <span className="max-w-[180px] truncate">
          {file.name}
        </span>

        <button
          type="button"
          onClick={() =>
            setPrivateChatFiles((prev) =>
              prev.filter((_, fileIndex) => fileIndex !== index)
            )
          }
          className="text-red-600 hover:text-red-700"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    ))}
  </div>
)}

{privateTypingUsers.length > 0 && (
  <div className="mb-2 text-xs text-muted-foreground">
    {privateTypingUsers.length === 1
      ? `${privateTypingUsers[0].employeeName} está digitando...`
      : `${privateTypingUsers.length} pessoas estão digitando...`}
  </div>
)}


  {replyingToPrivateMessage && (
    <div className="mb-2 flex items-center justify-between rounded-xl border-l-4 border-secondary bg-muted px-3 py-2 text-xs">
      <div className="min-w-0">
       <p className="font-semibold">
  Respondendo a{" "}
  {replyingToPrivateMessage.sender?.name ||
    (replyingToPrivateMessage.senderId === employee.id
      ? "você"
      : "Mensagem")}
</p>
        <p className="truncate text-muted-foreground">
          {replyingToPrivateMessage.message || "Mídia"}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setReplyingToPrivateMessage(null)}
        className="ml-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )}

  <div className="flex items-end gap-2">
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => privateChatFileInputRef.current?.click()}
      className="h-11 w-11 shrink-0"
    >
      <Camera className="h-4 w-4" />
    </Button>

    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={
        isRecordingPrivateAudio
          ? stopPrivateAudioRecording
          : startPrivateAudioRecording
      }
      className={`h-11 w-11 shrink-0 ${
        isRecordingPrivateAudio
          ? "border-red-500 text-red-600 animate-pulse"
          : ""
      }`}
    >
      {isRecordingPrivateAudio ? (
        <Square className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>

    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setShowPrivateEmojiPicker((prev) => !prev)}
        className="h-11 w-11 shrink-0"
      >
        <Smile className="h-4 w-4" />
      </Button>

      {showPrivateEmojiPicker && (
        <div className="absolute bottom-12 left-0 z-[9300]">
          <EmojiPicker
            theme={Theme.LIGHT}
            onEmojiClick={(emojiData) => {
              setPrivateMessageText((prev) => prev + emojiData.emoji);
              setShowPrivateEmojiPicker(false);
            }}
          />
        </div>
      )}
    </div>

    <Textarea
      value={privateMessageText}
      onChange={(e) => {
  setPrivateMessageText(e.target.value);
  sendPrivateTypingSignal();
}}
      placeholder="Digite uma mensagem..."
      rows={1}
      className="min-h-[44px] max-h-28 resize-none text-base flex-1"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendPrivateMessage();
        }
      }}
    />

    <Button
      type="button"
      size="icon"
      disabled={
        sendingPrivateMessage ||
        (!privateMessageText.trim() && privateChatFiles.length === 0)
      }
      onClick={sendPrivateMessage}
      className="h-11 w-11 shrink-0 bg-secondary hover:bg-secondary/90"
    >
      <Send className="h-4 w-4" />
    </Button>
  </div>
</div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

{showLogoutConfirm && (
  <div
    className="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4"
    onClick={() => setShowLogoutConfirm(false)}
  >
    <div
      className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-border"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <LogOut className="w-6 h-6 text-red-600" />
        </div>

        <h3 className="text-lg font-semibold mb-2">
          Confirmar saída
        </h3>

        <p className="text-sm text-muted-foreground mb-6">
          Tem certeza que deseja sair do sistema?
        </p>
      </div>

      {isRecordingAudio && (
  <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
    Gravando áudio... {audioSeconds}s
  </div>
)}

      {chatFiles.length > 0 && (
  <div className="mb-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
    <div className="flex items-center justify-between gap-2">
      <span className="truncate">
        {chatFiles.length} arquivo{chatFiles.length > 1 ? "s" : ""} selecionado
        {chatFiles.length > 1 ? "s" : ""}
      </span>

      <button
        type="button"
        onClick={() => {
          setChatFiles([]);

          if (chatFileInputRef.current) {
            chatFileInputRef.current.value = "";
          }
        }}
        className="text-red-600 hover:text-red-700"
      >
        Remover
      </button>
    </div>
  </div>
)}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setShowLogoutConfirm(false)}
        >
          Cancelar
        </Button>

        <Button
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          onClick={handleLogout}
        >
          Sair
        </Button>
      </div>
    </div>
  </div>
)}

{expandedMedia && (
  <div
    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
    onClick={() => setExpandedMedia(null)}
    onTouchStart={(e) => {
      touchStartX.current = e.changedTouches[0].clientX;
    }}
    onTouchEnd={(e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - endX;

      if (!expandedMedia || expandedMedia.items.length <= 1) return;

      if (diff > 50) {
        setExpandedMedia((prev) =>
          prev
            ? {
                ...prev,
                index:
                  prev.index === prev.items.length - 1 ? 0 : prev.index + 1,
              }
            : prev
        );
      }

      if (diff < -50) {
        setExpandedMedia((prev) =>
          prev
            ? {
                ...prev,
                index:
                  prev.index === 0 ? prev.items.length - 1 : prev.index - 1,
              }
            : prev
        );
      }
    }}
  >

    {expandedMedia.items.length > 1 && (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();

            setExpandedMedia((prev) =>
              prev
                ? {
                    ...prev,
                    index:
                      prev.index === 0
                        ? prev.items.length - 1
                        : prev.index - 1,
                  }
                : prev
            );
          }}
          className="
absolute
left-2
sm:left-4
top-1/2
-ztranslate-y-1/2
z-[10001]
bg-black/70
text-white
rounded-full
w-12
h-12
sm:w-10
sm:h-10
flex
items-center
justify-center
text-3xl
touch-manipulation
"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();

            setExpandedMedia((prev) =>
              prev
                ? {
                    ...prev,
                    index:
                      prev.index === prev.items.length - 1
                        ? 0
                        : prev.index + 1,
                  }
                : prev
            );
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl"
        >
          ›
        </button>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
          {expandedMedia.index + 1} / {expandedMedia.items.length}
        </div>
      </>
    )}

    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        downloadMedia(expandedMedia.items[expandedMedia.index]?.mediaUrl);
      }}
      className="absolute top-4 right-16 bg-black/60 hover:bg-black/80 text-white rounded-full px-4 h-10 flex items-center justify-center text-sm"
    >
      Baixar
    </button>

    <button
      type="button"
      onClick={() => setExpandedMedia(null)}
      className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl"
    >
      ✕
    </button>
  </div>
)}

      </div>
    </div>
  );
};



export default EmployeePanel;
