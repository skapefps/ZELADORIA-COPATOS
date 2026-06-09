import React, { useState, useEffect, useRef } from "react";
import { Flame, LocateFixed, MapPin, Satellite, ZoomIn, ZoomOut } from "lucide-react";

export type MapReport = {
  id: number;
  title?: string | null;
  description?: string | null;
  referencePoint?: string | null;
  priority?: string | null;
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
    color?: string | null;
  };
  employee: {
    id: number;
    name: string;
    department?: string | null;
  };
  participants?: {
    id: number;
    employeeId: number;
    employee: {
      id: number;
      name: string;
      department?: string | null;
    };
  }[];
  images?: {
    id: number;
    imageUrl: string;
    resourceType?: string | null;
  }[];
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

type LeafletLayer = {
  addTo: (map: LeafletMap) => LeafletLayer;
};

type LeafletLayerGroup = LeafletLayer & {
  addLayer: (layer: LeafletLayer) => void;
};

type LeafletLatLng = {
  lat: number;
  lng: number;
};

type LeafletClickEvent = {
  latlng: LeafletLatLng;
};

type LeafletMarker = LeafletLayer & {
  addTo: (map: LeafletMap) => LeafletMarker;
  bindPopup: (content: string) => LeafletMarker;
  openPopup: () => LeafletMarker;
  setLatLng: (coordinates: [number, number]) => LeafletMarker;
  getLatLng: () => LeafletLatLng;
  on: (eventName: "click" | "dragend", callback: () => void) => LeafletMarker;
};

type LeafletMap = {
  setView: (center: [number, number], zoom: number) => LeafletMap;
  addLayer: (layer: LeafletLayer) => void;
  fitBounds: (bounds: [number, number][], options?: { padding?: [number, number] }) => LeafletMap;
  getCenter: () => LeafletLatLng;
  zoomIn: () => void;
  zoomOut: () => void;
  on: (eventName: "click", callback: (event: LeafletClickEvent) => void) => void;
  invalidateSize: () => void;
  remove: () => void;
};

type LeafletApi = {
  map: (element: HTMLElement, options?: { zoomControl?: boolean }) => LeafletMap;
  tileLayer: (
    url: string,
    options: { attribution: string; maxZoom?: number; subdomains?: string | string[] }
  ) => LeafletLayer;
  marker: (
    coordinates: [number, number],
    options?: { draggable?: boolean }
  ) => LeafletMarker;
  layerGroup: () => LeafletLayerGroup;
  control: {
    layers: (
      baseLayers: Record<string, LeafletLayer>,
      overlays?: Record<string, LeafletLayer>,
      options?: { position?: string; collapsed?: boolean }
    ) => LeafletLayer;
    zoom: (options?: { position?: string }) => LeafletLayer;
  };
  markerClusterGroup?: () => LeafletLayerGroup;
  heatLayer?: (
    points: [number, number, number][],
    options: {
      radius: number;
      blur: number;
      maxZoom: number;
      gradient: Record<number, string>;
    }
  ) => LeafletLayer;
};

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

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
  const mapRef = useRef<LeafletMap | null>(null);
  const locatedReportsRef = useRef<Array<MapReport & { latitude: number; longitude: number }>>([]);
  const onSelectReportRef = useRef(onSelectReport);

  useEffect(() => {
    onSelectReportRef.current = onSelectReport;
  }, [onSelectReport]);

  const fitAllReports = () => {
    const map = mapRef.current;
    const locatedReports = locatedReportsRef.current;

    if (!map || locatedReports.length === 0) return;

    map.fitBounds(
      locatedReports.map((report) => [report.latitude, report.longitude]),
      { padding: [42, 42] }
    );
    window.setTimeout(() => map.invalidateSize(), 120);
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up previous map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const L = window.L;
    if (!L) return;

    const reportsWithLocation = reports.filter(
      (
        report
      ): report is MapReport & { latitude: number; longitude: number } =>
        typeof report.latitude === "number" &&
        typeof report.longitude === "number"
    );
    locatedReportsRef.current = reportsWithLocation;
    const center: [number, number] = reportsWithLocation[0]
      ? [reportsWithLocation[0].latitude!, reportsWithLocation[0].longitude!]
      : [-18.579, -46.519];
    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView(center, 14);
    mapRef.current = map;

    const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    });
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles © Esri",
        maxZoom: 19,
      }
    );

    streetLayer.addTo(map);
    L.control.layers(
      {
        "Ruas": streetLayer,
        "Satélite": satelliteLayer,
      },
      undefined,
      { position: "topright", collapsed: false }
    ).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    if (mapTab === "markers") {
      const markers = L.markerClusterGroup ? L.markerClusterGroup() : L.layerGroup();

      reportsWithLocation.forEach((r) => {
        const marker = L.marker([r.latitude, r.longitude]);
        marker.bindPopup(
          `<strong>${r.title || r.category.name}</strong><br/>
           <small>${r.referencePoint || r.address || "Local informado por coordenada"}</small><br/>
           <small>Status: ${r.status.name}</small><br/>
           <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${r.latitude},${r.longitude}" target="_blank" rel="noopener noreferrer">Abrir Street View</a>`
        );
        marker.on("click", () => onSelectReportRef.current(r));
        markers.addLayer(marker);
      });

      map.addLayer(markers);
    } else {
      // Heatmap
      if (L.heatLayer) {
        const points = reportsWithLocation.map((r) => [
          r.latitude,
          r.longitude,
          (CATEGORY_WEIGHTS[r.category.name] || 1) / 5,
        ] as [number, number, number]);
        L.heatLayer(points, {
          radius: 30,
          blur: 20,
          maxZoom: 17,
          gradient: { 0.2: "#22c55e", 0.5: "#eab308", 0.8: "#f97316", 1: "#ef4444" },
        }).addTo(map);
      }
    }

    if (reportsWithLocation.length > 1) {
      map.fitBounds(
        reportsWithLocation.map((report) => [report.latitude, report.longitude]),
        { padding: [42, 42] }
      );
    }

    window.setTimeout(() => map.invalidateSize(), 120);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapTab, reports]);

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
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

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
          >
            <ZoomOut className="h-4 w-4" /> Afastar
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
          >
            <ZoomIn className="h-4 w-4" /> Aproximar
          </button>
          <button
            type="button"
            onClick={fitAllReports}
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
          >
            <LocateFixed className="h-4 w-4" /> Ver tudo
          </button>
          <span className="flex items-center gap-1 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <Satellite className="h-3.5 w-3.5" /> Satélite no seletor do mapa
          </span>
        </div>
      </div>
      <div
        ref={mapContainerRef}
        className="w-full h-[500px] rounded-xl border border-border overflow-hidden"
      />
    </div>
  );
};

export default DashboardMaps;
