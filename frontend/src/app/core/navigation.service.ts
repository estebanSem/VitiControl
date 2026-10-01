import { Injectable, inject, signal } from "@angular/core";
import { Parcel } from "../models/vineyard.models";
import { NotebookStore } from "./notebook.store";
import { UiState } from "./ui.state";

@Injectable({ providedIn: "root" })
export class NavigationService {
  private readonly notebook = inject(NotebookStore);
  private readonly ui = inject(UiState);
  page = signal("Resumen");

  menuOpen = false;

  nav = [
    { label: "Resumen", icon: "layout-dashboard" },
    { label: "Parcelas", icon: "sprout" },
    { label: "Cuaderno de campo", icon: "notebook-pen" },
    { label: "Agenda", icon: "calendar-days" },
    { label: "Informes", icon: "chart-no-axes-combined" },
  ];

  go(p: string) {
    this.page.set(p);
    this.notebook.search.set("");
    this.notebook.selectedParcel.set(null);
    this.menuOpen = false;
    this.ui.error.set("");
  }

  viewParcel(p: Parcel) {
    this.notebook.selectedParcel.set(p.id);
    this.page.set("Cuaderno de campo");
    this.notebook.filter.set("Todas");
    this.notebook.parcelFilter.set(0);
  }
}
