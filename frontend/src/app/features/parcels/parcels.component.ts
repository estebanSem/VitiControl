import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { EditorService } from "../../core/editor.service";
import { DisplayService } from "../../core/format.service";
import { NavigationService } from "../../core/navigation.service";
import { NotebookStore } from "../../core/notebook.store";

@Component({
  selector: "app-parcels",
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: "./parcels.component.html",
  styleUrl: "./parcels.component.css",
  host: { style: "display: contents" },
})
export class ParcelsPageComponent {
  readonly navigation = inject(NavigationService);
  readonly notebook = inject(NotebookStore);
  readonly format = inject(DisplayService);
  readonly editor = inject(EditorService);
}
