import { errorMessage } from "./errors";
import { Injectable, computed, inject, signal } from "@angular/core";
import { seedData } from "../demo/seed-data";
import { Campaign, Data, Parcel, RecordItem } from "../models/vineyard.models";
import { ApiService } from "./http.service";
import { SessionState } from "./session.state";
import { UiState } from "./ui.state";

@Injectable({ providedIn: "root" })
export class NotebookStore {
  private readonly http = inject(ApiService);
  private readonly session = inject(SessionState);
  private readonly ui = inject(UiState);
  data = signal<Data>({ parcels: [], campaigns: [], records: [] });

  year = signal(2026);

  search = signal("");

  filter = signal("Todas");

  parcelFilter = signal(0);

  selectedParcel = signal<number | null>(null);

  kinds = [
    "Riego",
    "Tratamiento",
    "Poda",
    "Abonado",
    "Vendimia",
    "Incidencia",
    "Tarea",
  ];

  records = computed(() =>
    this.data()
      .records.filter((r) => r.campaign === this.year())
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
  );

  filtered = computed(() =>
    this.records().filter(
      (r) =>
        (this.filter() === "Todas" || r.kind === this.filter()) &&
        (!this.parcelFilter() || r.parcel_id === this.parcelFilter()) &&
        (!this.selectedParcel() || r.parcel_id === this.selectedParcel()) &&
        `${r.title} ${r.notes} ${this.parcel(r.parcel_id)?.name}`
          .toLowerCase()
          .includes(this.search().toLowerCase()),
    ),
  );

  harvest = computed(() =>
    this.records().filter((r) => r.kind === "Vendimia" && r.completed),
  );

  totalKg = computed(() => this.harvest().reduce((a, r) => a + r.quantity, 0));

  cost = computed(() =>
    this.records()
      .filter((r) => r.completed)
      .reduce((a, r) => a + r.cost, 0),
  );

  pending = computed(() =>
    this.records()
      .filter((r) => !r.completed)
      .sort((a, b) => a.date.localeCompare(b.date)),
  );

  area = computed(() => this.data().parcels.reduce((a, p) => a + p.area, 0));

  vines = computed(() => this.data().parcels.reduce((a, p) => a + p.vines, 0));

  previousKg = computed(() =>
    this.data()
      .records.filter(
        (r) =>
          r.campaign === this.year() - 1 &&
          r.kind === "Vendimia" &&
          r.completed,
      )
      .reduce((a, r) => a + r.quantity, 0),
  );

  growth = computed(() =>
    this.previousKg() ? (this.totalKg() / this.previousKg() - 1) * 100 : null,
  );

  recent = computed(() =>
    this.records()
      .filter((r) => r.completed)
      .slice(0, 5),
  );

  async reload() {
    const [parcels, campaigns, records] = await Promise.all([
      this.http.api<Parcel[]>("/parcels"),
      this.http.api<Campaign[]>("/campaigns"),
      this.http.api<RecordItem[]>("/records"),
    ]);
    this.data.set({ parcels, campaigns, records });
    if (campaigns.length && !campaigns.some((c) => c.year === this.year()))
      this.year.set(campaigns[0].year);
  }

  persist() {
    localStorage.setItem("viticontrol-demo-v1", JSON.stringify(this.data()));
  }

  parcel(id: number) {
    return this.data().parcels.find((p) => p.id === id);
  }

  kg(id: number) {
    return this.harvest()
      .filter((r) => r.parcel_id === id)
      .reduce((a, r) => a + r.quantity, 0);
  }

  async complete(r: RecordItem) {
    try {
      if (this.session.demo) {
        this.data.update((d) => ({
          ...d,
          records: d.records.map((x) =>
            x.id === r.id ? { ...x, completed: !x.completed } : x,
          ),
        }));
        this.persist();
      } else {
        await this.http.api("/records/" + r.id, "PUT", {
          ...r,
          completed: !r.completed,
        });
        await this.reload();
      }
      this.ui.notify(r.completed ? "Tarea pendiente" : "Tarea completada");
    } catch (e: unknown) {
      this.ui.notify(errorMessage(e));
    }
  }

  historyKg(y: number) {
    return this.data()
      .records.filter(
        (r) => r.campaign === y && r.kind === "Vendimia" && r.completed,
      )
      .reduce((a, r) => a + r.quantity, 0);
  }

  historyMax() {
    return Math.max(
      0,
      ...this.data().campaigns.map((c) => this.historyKg(c.year)),
    );
  }

  parcelCost(id: number) {
    return this.records()
      .filter((r) => r.parcel_id === id && r.completed)
      .reduce((a, r) => a + r.cost, 0);
  }

  reset() {
    if (
      confirm(
        "¿Restaurar los datos de ejemplo? Se eliminarán tus cambios en esta demo.",
      )
    ) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)!;
        if (k.startsWith("viti-photos-")) localStorage.removeItem(k);
      }
      this.data.set(seedData());
      this.year.set(2026);
      this.persist();
      this.ui.notify("Demo restaurada");
    }
  }
  constructor() {
    if (this.session.demo) {
      try {
        const raw = localStorage.getItem("viticontrol-demo-v1");
        this.data.set(raw ? JSON.parse(raw) : seedData());
      } catch {
        this.data.set(seedData());
        this.ui.notify("No se pudo leer la demo guardada.");
      }
    }
  }
}
