import { Injectable, inject } from "@angular/core";
import { EditorService } from "./editor.service";
import { NotebookStore } from "./notebook.store";
import { SessionState } from "./session.state";
import { ModelContext } from "../models/model-context.models";

@Injectable({ providedIn: "root" })
export class ModelToolsService {
  private readonly session = inject(SessionState);
  private readonly notebook = inject(NotebookStore);
  private readonly editor = inject(EditorService);
  registerTools() {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
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
        execute: (input: unknown) => {
          if (!this.session.logged()) throw new Error("Inicia sesión");
          if (!input || typeof input !== "object" || Object.keys(input).length)
            throw new Error("Entrada inválida");
          return {
            campaign: this.notebook.year(),
            parcels: this.notebook.data().parcels.length,
            areaHa: this.notebook.area(),
            harvestKg: this.notebook.totalKg(),
            costEur: this.notebook.cost(),
            pendingTasks: this.notebook.pending().length,
            demo: this.session.demo,
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
          properties: { kind: { type: "string", enum: this.notebook.kinds } },
          required: ["kind"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input: unknown) => {
          if (!this.session.logged()) throw new Error("Inicia sesión");
          if (
            !input ||
            typeof input !== "object" ||
            !("kind" in input) ||
            typeof input.kind !== "string" ||
            Object.keys(input).some((k) => k !== "kind") ||
            !this.notebook.kinds.includes(input.kind)
          )
            throw new Error("Tipo inválido");
          this.editor.openRecord(input.kind);
          return { form: this.editor.modal(), kind: input.kind, saved: false };
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
}
