import {
  Component,
  signal,
  computed,
  HostListener,
  provideZonelessChangeDetection,
  effect,
  importProvidersFrom,
} from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  LucideAngularModule,
  LayoutDashboard,
  Sprout,
  NotebookPen,
  CalendarDays,
  ChartNoAxesCombined,
  Settings,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Droplets,
  Scissors,
  FlaskConical,
  Grape,
  MapPin,
  Check,
  X,
  Download,
  Leaf,
  Menu,
  LogOut,
  Ellipsis,
  Camera,
  Trash2,
  Pencil,
  TriangleAlert,
  Wallet,
  Clock,
  CheckCheck,
} from "lucide-angular";
import { environment } from "./environment";
import { Data, Parcel, RecordItem, seedData } from "./data";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: "./app.html",
})
class App {
  demo = environment.demo;
  logged = signal(environment.demo);
  loading = signal(!environment.demo);
  busy = signal(false);
  error = signal("");
  toast = signal("");
  user = "admin";
  password = "";
  data = signal<Data>({ parcels: [], campaigns: [], records: [] });
  page = signal("Resumen");
  year = signal(2026);
  search = signal("");
  filter = signal("Todas");
  parcelFilter = signal(0);
  selectedParcel = signal<number | null>(null);
  menuOpen = false;
  modal = signal<"record" | "parcel" | "campaign" | "detail" | null>(null);
  editingId: number | null = null;
  form: any = {};
  detail: RecordItem | null = null;
  photos = signal<{ id: number; url: string }[]>([]);
  pendingFile: File | null = null;
  nav = [
    { label: "Resumen", icon: "layout-dashboard" },
    { label: "Parcelas", icon: "sprout" },
    { label: "Cuaderno de campo", icon: "notebook-pen" },
    { label: "Agenda", icon: "calendar-days" },
    { label: "Informes", icon: "chart-no-axes-combined" },
  ];
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
  constructor() {
    this.registerTools();
    effect(() => {
      if (this.modal()) {
        setTimeout(
          () =>
            document
              .querySelector<HTMLElement>(
                ".modal input,.modal select,.modal .icon-button",
              )
              ?.focus(),
          0,
        );
      }
    });
    if (this.demo) {
      try {
        const raw = localStorage.getItem("viticontrol-demo-v1");
        this.data.set(raw ? JSON.parse(raw) : seedData());
      } catch {
        this.data.set(seedData());
        this.notify("No se pudo leer la demo guardada.");
      }
    } else this.checkSession();
  }
  registerTools() {
    const context = (document as any).modelContext;
    if (!context?.registerTool) return;
    const life = new AbortController();
    window.addEventListener("pagehide", () => life.abort(), { once: true });
    for (const tool of [
      {
        name: "read_vineyard_summary",
        title: "Resumen del viñedo",
        description:
          "Read the selected campaign summary from the visible vineyard notebook.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: (input: any) => {
          if (!this.logged()) throw new Error("Inicia sesión");
          if (!input || Object.keys(input).length)
            throw new Error("Entrada inválida");
          return {
            campaign: this.year(),
            parcels: this.data().parcels.length,
            areaHa: this.area(),
            harvestKg: this.totalKg(),
            costEur: this.cost(),
            pendingTasks: this.pending().length,
            demo: this.demo,
          };
        },
      },
      {
        name: "start_field_record",
        title: "Preparar registro",
        description:
          "Open the field record form for a supported labor type. Does not save the record.",
        inputSchema: {
          type: "object",
          properties: { kind: { type: "string", enum: this.kinds } },
          required: ["kind"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input: any) => {
          if (!this.logged()) throw new Error("Inicia sesión");
          if (
            !input ||
            Object.keys(input).some((k) => k !== "kind") ||
            !this.kinds.includes(input.kind)
          )
            throw new Error("Tipo inválido");
          this.openRecord(input.kind);
          return { form: this.modal(), kind: input.kind, saved: false };
        },
      },
    ]) {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: life.signal }),
        ).catch(() => {});
      } catch {}
    }
  }
  async api(path: string, method = "GET", body?: unknown) {
    const r = await fetch("/api" + path, {
      method,
      credentials: "same-origin",
      headers:
        body instanceof FormData ? {} : { "Content-Type": "application/json" },
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
    if (!r.ok) {
      let e: any = {};
      try {
        e = await r.json();
      } catch {}
      if (r.status === 401) this.logged.set(false);
      throw new Error(
        typeof e.detail === "string"
          ? e.detail
          : Array.isArray(e.detail)
            ? e.detail.map((x: any) => x.msg).join(". ")
            : "No se pudo completar la operación",
      );
    }
    return r.status === 204 ? null : r.json();
  }
  async checkSession() {
    try {
      await this.api("/me");
      this.logged.set(true);
      await this.reload();
    } catch {
    } finally {
      this.loading.set(false);
    }
  }
  async login() {
    this.busy.set(true);
    this.error.set("");
    try {
      await this.api("/login", "POST", {
        username: this.user,
        password: this.password,
      });
      this.logged.set(true);
      this.password = "";
      await this.reload();
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.busy.set(false);
    }
  }
  async logout() {
    try {
      await this.api("/logout", "POST");
      this.logged.set(false);
      this.data.set({ parcels: [], records: [], campaigns: [] });
    } catch (e: any) {
      this.error.set(e.message);
    }
  }
  async reload() {
    const [parcels, campaigns, records] = await Promise.all([
      this.api("/parcels"),
      this.api("/campaigns"),
      this.api("/records"),
    ]);
    this.data.set({ parcels, campaigns, records });
    if (campaigns.length && !campaigns.some((c: any) => c.year === this.year()))
      this.year.set(campaigns[0].year);
  }
  persist() {
    localStorage.setItem("viticontrol-demo-v1", JSON.stringify(this.data()));
  }
  notify(s: string) {
    this.toast.set(s);
    setTimeout(() => this.toast.set(""), 4000);
  }
  go(p: string) {
    this.page.set(p);
    this.search.set("");
    this.selectedParcel.set(null);
    this.menuOpen = false;
    this.error.set("");
  }
  parcel(id: number) {
    return this.data().parcels.find((p) => p.id === id);
  }
  kg(id: number) {
    return this.harvest()
      .filter((r) => r.parcel_id === id)
      .reduce((a, r) => a + r.quantity, 0);
  }
  euro(n: number) {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: n > 0 && n < 1 ? 2 : 0,
    }).format(n);
  }
  num(n: number, d = 0) {
    return new Intl.NumberFormat("es-ES", { maximumFractionDigits: d }).format(
      n,
    );
  }
  date(s: string) {
    return new Date(s + "T12:00:00").toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  }
  today() {
    return new Date().toLocaleDateString("sv-SE");
  }
  overdue(r: RecordItem) {
    return !r.completed && r.date < this.today();
  }
  icon(kind: string) {
    return (
      (
        {
          Riego: "droplets",
          Tratamiento: "flask-conical",
          Poda: "scissors",
          Vendimia: "grape",
          Abonado: "leaf",
          Incidencia: "triangle-alert",
          Tarea: "calendar-days",
        } as any
      )[kind] || "notebook-pen"
    );
  }
  openRecord(kind = "Riego", r?: RecordItem) {
    if (!this.data().parcels.length) {
      this.notify("Crea una parcela antes de registrar una labor.");
      this.openParcel();
      return;
    }
    if (!this.data().campaigns.length) {
      this.openCampaign();
      return;
    }
    this.editingId = r?.id ?? null;
    this.form = r
      ? { ...r }
      : {
          parcel_id: this.selectedParcel() ?? this.data().parcels[0].id,
          campaign: this.year(),
          kind,
          date: this.today(),
          title: "",
          notes: "",
          cost: 0,
          quantity: 0,
          brix: null,
          product: "",
          dose: "",
          unit: kind === "Riego" ? "h" : kind === "Vendimia" ? "kg" : "",
          completed: kind !== "Tarea",
        };
    this.pendingFile = null;
    this.error.set("");
    this.modal.set("record");
  }
  kindChanged() {
    this.form.unit =
      this.form.kind === "Riego"
        ? "h"
        : this.form.kind === "Vendimia"
          ? "kg"
          : "";
    this.form.completed = this.form.kind !== "Tarea";
  }
  openParcel(p?: Parcel) {
    this.editingId = p?.id ?? null;
    this.form = p
      ? { ...p }
      : {
          name: "",
          variety: "",
          area: 1,
          vines: 0,
          planted: new Date().getFullYear(),
          location: "",
          notes: "",
        };
    this.error.set("");
    this.modal.set("parcel");
  }
  openCampaign() {
    this.editingId = null;
    this.error.set("");
    this.form = {
      year: this.data().campaigns.length
        ? Math.max(...this.data().campaigns.map((c) => c.year)) + 1
        : new Date().getFullYear(),
      name: "",
    };
    this.error.set("");
    this.modal.set("campaign");
  }
  close() {
    if (!this.busy()) {
      this.modal.set(null);
      this.error.set("");
    }
  }
  @HostListener("document:keydown.escape") escape() {
    this.close();
  }
  async save() {
    this.busy.set(true);
    this.error.set("");
    try {
      const type = this.modal();
      let body = { ...this.form };
      delete body.id;
      if (type === "campaign") {
        body.name = body.name.trim() || `Campaña ${body.year}`;
        if (this.data().campaigns.some((c) => c.year === body.year))
          throw new Error("Esta campaña ya existe.");
      }
      if (type === "record") {
        if (body.kind === "Tratamiento" && !body.product.trim())
          throw new Error("Indica el producto utilizado.");
        if (body.kind === "Vendimia" && !(body.quantity > 0))
          throw new Error("Indica los kilos recogidos.");
        if (body.brix === "") body.brix = null;
      }
      const key =
        type === "parcel"
          ? "parcels"
          : type === "campaign"
            ? "campaigns"
            : "records";
      const id =
        this.editingId ??
        Math.max(0, ...(this.data()[key] as any[]).map((x) => x.id)) + 1;
      let result: any;
      if (this.demo) {
        result = { ...body, id };
        this.data.update((d) => ({
          ...d,
          [key]: this.editingId
            ? (d[key] as any[]).map((x) => (x.id === id ? result : x))
            : [...d[key], result],
        }));
        this.persist();
      } else {
        result = await this.api(
          `/${key}` + (this.editingId ? `/${this.editingId}` : ""),
          this.editingId ? "PUT" : "POST",
          body,
        );
        await this.reload();
      }
      if (type === "campaign") this.year.set(body.year);
      if (type === "record" && this.pendingFile) {
        try {
          await this.savePhoto(result.id, this.pendingFile);
        } catch (e: any) {
          this.notify("Registro guardado; fotografía pendiente: " + e.message);
          this.modal.set(null);
          return;
        }
      }
      this.modal.set(null);
      this.notify(
        this.editingId ? "Cambios guardados" : "Guardado en tu cuaderno",
      );
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.busy.set(false);
    }
  }
  async complete(r: RecordItem) {
    try {
      if (this.demo) {
        this.data.update((d) => ({
          ...d,
          records: d.records.map((x) =>
            x.id === r.id ? { ...x, completed: !x.completed } : x,
          ),
        }));
        this.persist();
      } else {
        await this.api("/records/" + r.id, "PUT", {
          ...r,
          completed: !r.completed,
        });
        await this.reload();
      }
      this.notify(r.completed ? "Tarea pendiente" : "Tarea completada");
    } catch (e: any) {
      this.notify(e.message);
    }
  }
  async remove(type: "records" | "parcels", id: number) {
    if (
      !confirm(
        "¿Eliminar este " +
          (type === "records" ? "registro" : "parcela") +
          "? Esta acción no se puede deshacer.",
      )
    )
      return;
    try {
      if (this.demo) {
        if (
          type === "parcels" &&
          this.data().records.some((r) => r.parcel_id === id)
        )
          throw new Error(
            "La parcela tiene registros. Conserva su histórico o elimina primero los registros.",
          );
        this.data.update((d) => ({
          ...d,
          [type]: d[type].filter((x) => x.id !== id),
        }));
        if (type === "records") localStorage.removeItem("viti-photos-" + id);
        this.persist();
      } else {
        await this.api("/" + type + "/" + id, "DELETE");
        await this.reload();
      }
      this.modal.set(null);
      this.notify("Eliminado");
    } catch (e: any) {
      this.notify(e.message);
    }
  }
  viewParcel(p: Parcel) {
    this.selectedParcel.set(p.id);
    this.page.set("Cuaderno de campo");
    this.filter.set("Todas");
    this.parcelFilter.set(0);
  }
  async view(r: RecordItem) {
    this.detail = r;
    this.photos.set([]);
    this.error.set("");
    this.modal.set("detail");
    try {
      this.photos.set(
        this.demo
          ? JSON.parse(localStorage.getItem("viti-photos-" + r.id) || "[]")
          : await this.api("/records/" + r.id + "/photos"),
      );
    } catch (e: any) {
      this.error.set(e.message);
    }
  }
  fileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.size > 5 * 1024 * 1024) {
      this.error.set("La fotografía no puede superar 5 MB.");
      return;
    }
    this.pendingFile = file ?? null;
  }
  async savePhoto(id: number, file: File) {
    if (this.demo) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw new Error("Utiliza JPEG, PNG o WebP.");
      const url = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const list = JSON.parse(
        localStorage.getItem("viti-photos-" + id) || "[]",
      );
      list.push({ id: Date.now(), url });
      localStorage.setItem("viti-photos-" + id, JSON.stringify(list));
    } else {
      const form = new FormData();
      form.append("file", file);
      await this.api("/records/" + id + "/photos", "POST", form);
    }
  }
  async addPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.detail) return;
    this.busy.set(true);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Máximo 5 MB.");
      await this.savePhoto(this.detail.id, file);
      await this.view(this.detail);
      this.notify("Fotografía guardada");
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.busy.set(false);
    }
  }
  download() {
    if (!this.demo) {
      window.location.href = "/api/export?campaign=" + this.year();
      return;
    }
    const escape = (v: any) => {
      let s = String(v ?? "");
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const rows = [
      [
        "Fecha",
        "Parcela",
        "Tipo",
        "Título",
        "Coste EUR",
        "Cantidad",
        "Unidad",
        "Brix",
        "Producto",
        "Dosis",
        "Observaciones",
      ],
      ...this.records().map((r) => [
        r.date,
        this.parcel(r.parcel_id)?.name,
        r.kind,
        r.title,
        r.cost,
        r.quantity,
        r.unit,
        r.brix,
        r.product,
        r.dose,
        r.notes,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\ufeff" + rows.map((row) => row.map(escape).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `campana-${this.year()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
  trapTab(e: Event) {
    const event = e as KeyboardEvent;
    const el = e.currentTarget as HTMLElement;
    const items = Array.from(
      el.querySelectorAll<HTMLElement>(
        "button:not([disabled]),input:not([disabled]),select,textarea,a[href]",
      ),
    );
    const first = items[0],
      last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
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
      this.notify("Demo restaurada");
    }
  }
}
bootstrapApplication(App, {
  providers: [
    provideZonelessChangeDetection(),
    importProvidersFrom(
      LucideAngularModule.pick({
        LayoutDashboard,
        Sprout,
        NotebookPen,
        CalendarDays,
        ChartNoAxesCombined,
        Settings,
        Plus,
        Search,
        ChevronDown,
        ChevronRight,
        ArrowUpRight,
        Droplets,
        Scissors,
        FlaskConical,
        Grape,
        MapPin,
        Check,
        X,
        Download,
        Leaf,
        Menu,
        LogOut,
        Ellipsis,
        Camera,
        Trash2,
        Pencil,
        TriangleAlert,
        Wallet,
        Clock,
        CheckCheck,
      }),
    ),
  ],
}).catch(console.error);
