import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { NavigationService } from "../core/navigation.service";
import { NotebookStore } from "../core/notebook.store";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: "./header.component.html",
  host: { style: "display: contents" },
})
export class HeaderComponent {
  readonly navigation = inject(NavigationService);
  readonly notebook = inject(NotebookStore);
}
