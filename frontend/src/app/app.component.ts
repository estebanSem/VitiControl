import { CommonModule } from "@angular/common";
import { Component, HostListener, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { AuthService } from "./core/auth.service";
import { EditorService } from "./core/editor.service";
import { ExportService } from "./core/exporter.service";
import { NavigationService } from "./core/navigation.service";
import { NotebookStore } from "./core/notebook.store";
import { SessionState } from "./core/session.state";
import { ModelToolsService } from "./core/tools.service";
import { UiState } from "./core/ui.state";
import { AgendaPageComponent } from "./features/agenda/agenda.component";
import { LoginComponent } from "./features/auth/login.component";
import { DashboardPageComponent } from "./features/dashboard/dashboard.component";
import { NotebookPageComponent } from "./features/notebook/notebook.component";
import { ParcelsPageComponent } from "./features/parcels/parcels.component";
import { ReportsPageComponent } from "./features/reports/reports.component";
import { SettingsPageComponent } from "./features/settings/settings.component";
import { HeaderComponent } from "./layout/header.component";
import { SidebarComponent } from "./layout/sidebar.component";
import { EditorDialogComponent } from "./shared/dialogs/editor-dialog.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    DashboardPageComponent,
    ParcelsPageComponent,
    NotebookPageComponent,
    AgendaPageComponent,
    ReportsPageComponent,
    SettingsPageComponent,
    LoginComponent,
    EditorDialogComponent,
    SidebarComponent,
    HeaderComponent,
  ],
  templateUrl: "./app.component.html",
})
export class AppComponent {
  readonly session = inject(SessionState);
  readonly ui = inject(UiState);
  readonly navigation = inject(NavigationService);
  readonly notebook = inject(NotebookStore);
  readonly editor = inject(EditorService);
  readonly exporter = inject(ExportService);
  readonly auth = inject(AuthService);
  readonly tools = inject(ModelToolsService);
  constructor() {
    this.tools.registerTools();
    if (!this.session.demo) void this.auth.checkSession();
  }
  @HostListener("document:keydown.escape") escape() {
    this.editor.close();
  }
}
