import React, { useState, useEffect, useRef } from "react";
import { Report, CATEGORY_WEIGHTS } from "@/data/mockData";
import { Flame, MapPin } from "lucide-react";

// We use basic Leaflet without React wrappers for simplicity with plugins
const DashboardMaps = ({
  reports,
  onSelectReport,
}: {
  reports: Report[];
  onSelectReport: (r: Report) => void;
}) => {
  const [mapTab, setMapTab] = useState<"heat" | "markers">("markers");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up previous map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const L = (window as any).L;
    if (!L) return;

    const center: [number, number] = [-18.579, -46.519];
    const map = L.map(mapContainerRef.current).setView(center, 14);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    if (mapTab === "markers") {
      const markers = L.markerClusterGroup ? L.markerClusterGroup() : L.layerGroup();

      reports.forEach((r) => {
        const marker = L.marker([r.latitude, r.longitude]);
        marker.bindPopup(
          `<strong>${r.category}</strong> (P${CATEGORY_WEIGHTS[r.category]})<br/>
           <small>${r.referencePoint}</small><br/>
           <small>Status: ${r.status}</small>`
        );
        marker.on("click", () => onSelectReport(r));
        markers.addLayer(marker);
      });

      map.addLayer(markers);
    } else {
      // Heatmap
      if ((L as any).heatLayer) {
        const points = reports.map((r) => [
          r.latitude,
          r.longitude,
          CATEGORY_WEIGHTS[r.category] / 5,
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
  }, [mapTab, reports, onSelectReport]);

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
