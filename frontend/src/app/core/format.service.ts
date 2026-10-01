import { Injectable } from "@angular/core";
import { RecordItem } from "../models/vineyard.models";

@Injectable({ providedIn: "root" })
export class DisplayService {
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
        } as { [kind: string]: string }
      )[kind] || "notebook-pen"
    );
  }
}
