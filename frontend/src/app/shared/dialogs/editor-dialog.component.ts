import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { EditorService } from "../../core/editor.service";
import { DisplayService } from "../../core/format.service";
import { NotebookStore } from "../../core/notebook.store";
import { UiState } from "../../core/ui.state";

import { CampaignFormComponent } from "../forms/campaign-form.component";
import { ParcelFormComponent } from "../forms/parcel-form.component";
import { RecordFormComponent } from "../forms/record-form.component";

@Component({
  selector: "app-editor-dialog",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    ParcelFormComponent,
    CampaignFormComponent,
    RecordFormComponent,
  ],
  templateUrl: "./editor-dialog.component.html",
  host: { style: "display: contents" },
})
export class EditorDialogComponent {
  readonly ui = inject(UiState);
  readonly notebook = inject(NotebookStore);
  readonly format = inject(DisplayService);
  readonly editor = inject(EditorService);
}
