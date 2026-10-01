import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { EditorService } from "../../core/editor.service";
import { DisplayService } from "../../core/format.service";
import { NotebookStore } from "../../core/notebook.store";

@Component({
  selector: "app-agenda",
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: "./agenda.component.html",
  host: { style: "display: contents" },
})
export class AgendaPageComponent {
  readonly notebook = inject(NotebookStore);
  readonly format = inject(DisplayService);
  readonly editor = inject(EditorService);
}
