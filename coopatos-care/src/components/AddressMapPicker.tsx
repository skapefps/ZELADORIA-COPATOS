import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

type Coordinates = {
  lat: number;
  lng: number;
};

type AddressMapPickerProps = {
  value: Coordinates;
  onChange: (coordinates: Coordinates) => void;
  label?: string;
};

type LeafletLatLng = {
  lat: number;
  lng: number;
};

type LeafletClickEvent = {
  latlng: LeafletLatLng;
};

type PickerLeafletLayer = {
  addTo: (map: PickerLeafletMap) => PickerLeafletLayer;
};

type PickerLeafletMarker = PickerLeafletLayer & {
  addTo: (map: PickerLeafletMap) => PickerLeafletMarker;
  setLatLng: (coordinates: [number, number]) => PickerLeafletMarker;
  getLatLng: () => LeafletLatLng;
  bindPopup: (content: string) => PickerLeafletMarker;
  openPopup: () => PickerLeafletMarker;
  on: (eventName: "dragend", callback: () => void) => PickerLeafletMarker;
};

type PickerLeafletMap = {
  setView: (center: [number, number], zoom: number) => PickerLeafletMap;
  on: (eventName: "click", callback: (event: LeafletClickEvent) => void) => void;
  remove: () => void;
  invalidateSize: () => void;
};

type PickerLeafletApi = {
  map: (element: HTMLElement, options?: { zoomControl?: boolean }) => PickerLeafletMap;
  tileLayer: (
    url: string,
    options: { attribution: string; maxZoom?: number }
  ) => PickerLeafletLayer;
  marker: (
    coordinates: [number, number],
    options?: { draggable?: boolean }
  ) => PickerLeafletMarker;
};

const getLeaflet = () =>
  (window as unknown as Window & { L?: PickerLeafletApi }).L;

export const AddressMapPicker = ({
  value,
  onChange,
  label = "Ajuste o ponto exato",
}: AddressMapPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<PickerLeafletMap | null>(null);
  const markerRef = useRef<PickerLeafletMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const L = getLeaflet();
    if (!L || !containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }

    const initialValue = initialValueRef.current;
    const map = L.map(containerRef.current, { zoomControl: true }).setView(
      [initialValue.lat, initialValue.lng],
      18
    );
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([initialValue.lat, initialValue.lng], { draggable: true });
    marker.addTo(map);
    marker.bindPopup("Arraste ou clique no mapa para ajustar");
    marker.openPopup();
    markerRef.current = marker;

    marker.on("dragend", () => {
      const next = marker.getLatLng();
      onChangeRef.current({ lat: next.lat, lng: next.lng });
    });

    map.on("click", (event) => {
      marker.setLatLng([event.latlng.lat, event.latlng.lng]);
      onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    window.setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    mapRef.current?.setView([value.lat, value.lng], 18);
    markerRef.current?.setLatLng([value.lat, value.lng]);
    window.setTimeout(() => mapRef.current?.invalidateSize(), 80);
  }, [value.lat, value.lng]);

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
        <MapPin className="h-4 w-4 text-secondary" />
        <span>{label}</span>
      </div>
      <div ref={containerRef} className="h-64 w-full" />
      <div className="border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Clique no mapa ou arraste o marcador para salvar o ponto exato.
      </div>
    </div>
  );
};
