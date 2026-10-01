import { errorMessage } from "./errors";
import { Injectable, effect, inject, signal } from "@angular/core";
import {
  EditorForm,
  NotebookEntity,
  Parcel,
  PhotoItem,
  RecordItem,
} from "../models/vineyard.models";
import { DisplayService } from "./format.service";
import { ApiService } from "./http.service";
import { NotebookStore } from "./notebook.store";
import { PhotoService } from "./photo.service";
import { SessionState } from "./session.state";
import { UiState } from "./ui.state";

@Injectable({ providedIn: "root" })
export class EditorService {
  private readonly notebook = inject(NotebookStore);
  private readonly ui = inject(UiState);
  private readonly format = inject(DisplayService);
  private readonly session = inject(SessionState);
  private readonly http = inject(ApiService);
  private readonly photo = inject(PhotoService);
  modal = signal<"record" | "parcel" | "campaign" | "detail" | null>(null);

  editingId: number | null = null;

  form: EditorForm = {};

  detail: RecordItem | null = null;

  photos = signal<PhotoItem[]>([]);

  pendingFile: File | null = null;

  openRecord(kind = "Riego", r?: RecordItem) {
    if (!this.notebook.data().parcels.length) {
      this.ui.notify("Crea una parcela antes de registrar una labor.");
      this.openParcel();
      return;
    }
    if (!this.notebook.data().campaigns.length) {
      this.openCampaign();
      return;
    }
    this.editingId = r?.id ?? null;
    this.form = r
      ? { ...r }
      : {
          parcel_id:
            this.notebook.selectedParcel() ??
            this.notebook.data().parcels[0].id,
          campaign: this.notebook.year(),
          kind,
          date: this.format.today(),
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
    this.ui.error.set("");
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
    this.ui.error.set("");
    this.modal.set("parcel");
  }

  openCampaign() {
    this.editingId = null;
    this.ui.error.set("");
    this.form = {
      year: this.notebook.data().campaigns.length
        ? Math.max(...this.notebook.data().campaigns.map((c) => c.year)) + 1
        : new Date().getFullYear(),
      name: "",
    };
    this.ui.error.set("");
    this.modal.set("campaign");
  }

  close() {
    if (!this.ui.busy()) {
      this.modal.set(null);
      this.ui.error.set("");
    }
  }

  escape() {
    this.close();
  }

  async save() {
    this.ui.busy.set(true);
    this.ui.error.set("");
    try {
      const type = this.modal();
      if (type !== "parcel" && type !== "campaign" && type !== "record") return;
      const body = { ...this.form };
      delete body.id;
      if (type === "campaign") {
        body.name = (body.name ?? "").trim() || `Campaña ${body.year}`;
        if (this.notebook.data().campaigns.some((c) => c.year === body.year))
          throw new Error("Esta campaña ya existe.");
      }
      if (type === "record") {
        if (body.kind === "Tratamiento" && !body.product?.trim())
          throw new Error("Indica el producto utilizado.");
        if (body.kind === "Vendimia" && !((body.quantity ?? 0) > 0))
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
        Math.max(0, ...this.notebook.data()[key].map((x) => x.id)) + 1;
      let result: NotebookEntity;
      if (this.session.demo) {
        result = { ...body, id } as NotebookEntity;
        this.notebook.data.update((d) => ({
          ...d,
          [key]: this.editingId
            ? d[key].map((x) => (x.id === id ? result : x))
            : [...d[key], result],
        }));
        this.notebook.persist();
      } else {
        result = await this.http.api<NotebookEntity>(
          `/${key}` + (this.editingId ? `/${this.editingId}` : ""),
          this.editingId ? "PUT" : "POST",
          body,
        );
        await this.notebook.reload();
      }
      if (type === "campaign" && body.year !== undefined)
        this.notebook.year.set(body.year);
      if (type === "record" && this.pendingFile) {
        try {
          await this.photo.savePhoto(result.id, this.pendingFile);
        } catch (e: unknown) {
          this.ui.notify(
            "Registro guardado; fotografía pendiente: " + errorMessage(e),
          );
          this.modal.set(null);
          return;
        }
      }
      this.modal.set(null);
      this.ui.notify(
        this.editingId ? "Cambios guardados" : "Guardado en tu cuaderno",
      );
    } catch (e: unknown) {
      this.ui.error.set(errorMessage(e));
    } finally {
      this.ui.busy.set(false);
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
      if (this.session.demo) {
        if (
          type === "parcels" &&
          this.notebook.data().records.some((r) => r.parcel_id === id)
        )
          throw new Error(
            "La parcela tiene registros. Conserva su histórico o elimina primero los registros.",
          );
        this.notebook.data.update((d) => ({
          ...d,
          [type]: d[type].filter((x) => x.id !== id),
        }));
        if (type === "records") localStorage.removeItem("viti-photos-" + id);
        this.notebook.persist();
      } else {
        await this.http.api("/" + type + "/" + id, "DELETE");
        await this.notebook.reload();
      }
      this.modal.set(null);
      this.ui.notify("Eliminado");
    } catch (e: unknown) {
      this.ui.notify(errorMessage(e));
    }
  }

  async view(r: RecordItem) {
    this.detail = r;
    this.photos.set([]);
    this.ui.error.set("");
    this.modal.set("detail");
    try {
      this.photos.set(
        this.session.demo
          ? JSON.parse(localStorage.getItem("viti-photos-" + r.id) || "[]")
          : await this.http.api<PhotoItem[]>("/records/" + r.id + "/photos"),
      );
    } catch (e: unknown) {
      this.ui.error.set(errorMessage(e));
    }
  }

  fileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.size > 5 * 1024 * 1024) {
      this.ui.error.set("La fotografía no puede superar 5 MB.");
      return;
    }
    this.pendingFile = file ?? null;
  }

  async addPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.detail) return;
    this.ui.busy.set(true);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Máximo 5 MB.");
      await this.photo.savePhoto(this.detail.id, file);
      await this.view(this.detail);
      this.ui.notify("Fotografía guardada");
    } catch (e: unknown) {
      this.ui.error.set(errorMessage(e));
    } finally {
      this.ui.busy.set(false);
    }
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
  constructor() {
    effect(() => {
      if (this.modal())
        setTimeout(
          () =>
            document
              .querySelector<HTMLElement>(
                ".modal input,.modal select,.modal .icon-button",
              )
              ?.focus(),
          0,
        );
    });
  }
}
