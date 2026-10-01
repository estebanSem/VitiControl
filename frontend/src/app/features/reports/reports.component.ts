import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { DisplayService } from "../../core/format.service";
import { NotebookStore } from "../../core/notebook.store";

@Component({
  selector: "app-reports",
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: "./reports.component.html",
  host: { style: "display: contents" },
})
export class ReportsPageComponent {
  readonly notebook = inject(NotebookStore);
  readonly format = inject(DisplayService);
}
