import { Component, inject } from "@angular/core";
import { ControlContainer, FormsModule, NgForm } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { EditorService } from "../../core/editor.service";
import { NotebookStore } from "../../core/notebook.store";

@Component({
  selector: "app-parcel-form",
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: "./parcel-form.component.html",
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  host: { style: "display: contents" },
})
export class ParcelFormComponent {
  readonly editor = inject(EditorService);
  readonly notebook = inject(NotebookStore);
}
