import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { ExportService } from "../../core/exporter.service";
import { NavigationService } from "../../core/navigation.service";
import { NotebookStore } from "../../core/notebook.store";
import { SessionState } from "../../core/session.state";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: "./settings.component.html",
  host: { style: "display: contents" },
})
export class SettingsPageComponent {
  readonly session = inject(SessionState);
  readonly navigation = inject(NavigationService);
  readonly notebook = inject(NotebookStore);
  readonly exporter = inject(ExportService);
}
