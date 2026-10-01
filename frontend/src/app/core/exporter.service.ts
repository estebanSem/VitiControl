import { Injectable, inject } from "@angular/core";
import { NotebookStore } from "./notebook.store";
import { SessionState } from "./session.state";

@Injectable({ providedIn: "root" })
export class ExportService {
  private readonly session = inject(SessionState);
  private readonly notebook = inject(NotebookStore);
  download() {
    if (!this.session.demo) {
      window.location.href = "/api/export?campaign=" + this.notebook.year();
      return;
    }
    const escape = (v: unknown) => {
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
      ...this.notebook
        .records()
        .map((r) => [
          r.date,
          this.notebook.parcel(r.parcel_id)?.name,
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
    a.download = `campana-${this.notebook.year()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
