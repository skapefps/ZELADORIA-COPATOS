import React, { useState, useEffect, useRef } from "react";
import { Flame, MapPin } from "lucide-react";

type MapReport = {
  id: number;
  title?: string | null;
  description?: string | null;
  referencePoint?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  category: {
    id: number;
    name: string;
  };
  status: {
    id: number;
    name: string;
  };
};

const CATEGORY_WEIGHTS: Record<string, number> = {
  Segurança: 5,
  Elétrico: 4,
  Hídrico: 4,
  Erosão: 3,
  Vegetação: 2,
  Outros: 1,
  Outro: 1,
};

// We use basic Leaflet without React wrappers for simplicity with plugins
const DashboardMaps = ({
  reports,
  onSelectReport,
}: {
  reports: MapReport[];
  onSelectReport: (r: MapReport) => void;
}) => {
  const [mapTab, setMapTab] = useState<"heat" | "markers">("markers");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const onSelectReportRef = useRef(onSelectReport);

  useEffect(() => {
    onSelectReportRef.current = onSelectReport;
  }, [onSelectReport]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up previous map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const L = (window as any).L;
    if (!L) return;

    const reportsWithLocation = reports.filter(
      (report) => report.latitude && report.longitude
    );
    const center: [number, number] = reportsWithLocation[0]
      ? [reportsWithLocation[0].latitude!, reportsWithLocation[0].longitude!]
      : [-18.579, -46.519];
    const map = L.map(mapContainerRef.current).setView(center, 14);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    if (mapTab === "markers") {
      const markers = L.markerClusterGroup ? L.markerClusterGroup() : L.layerGroup();

      reportsWithLocation.forEach((r) => {
        const marker = L.marker([r.latitude, r.longitude]);
        marker.bindPopup(
          `<strong>${r.title || r.category.name}</strong><br/>
           <small>${r.referencePoint || r.address || "Local informado por coordenada"}</small><br/>
           <small>Status: ${r.status.name}</small>`
        );
        marker.on("click", () => onSelectReportRef.current(r));
        markers.addLayer(marker);
      });

      map.addLayer(markers);
    } else {
      // Heatmap
      if ((L as any).heatLayer) {
        const points = reportsWithLocation.map((r) => [
          r.latitude,
          r.longitude,
          (CATEGORY_WEIGHTS[r.category.name] || 1) / 5,
        ]);
        (L as any).heatLayer(points, {
          radius: 30,
          blur: 20,
          maxZoom: 17,
          gradient: { 0.2: "#22c55e", 0.5: "#eab308", 0.8: "#f97316", 1: "#ef4444" },
        }).addTo(map);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapTab, reports]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setMapTab("markers")}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            mapTab === "markers"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <MapPin className="w-4 h-4" /> Marcadores
        </button>
        <button
          onClick={() => setMapTab("heat")}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            mapTab === "heat"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Flame className="w-4 h-4" /> Mapa de Calor
        </button>
      </div>
      <div
        ref={mapContainerRef}
        className="w-full h-[500px] rounded-xl border border-border overflow-hidden"
      />
    </div>
  );
};

export default DashboardMaps;
