import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { AuthService } from "../core/auth.service";
import { NavigationService } from "../core/navigation.service";
import { NotebookStore } from "../core/notebook.store";
import { SessionState } from "../core/session.state";

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: "./sidebar.component.html",
  host: { style: "display: contents" },
})
export class SidebarComponent {
  readonly session = inject(SessionState);
  readonly navigation = inject(NavigationService);
  readonly notebook = inject(NotebookStore);
  readonly auth = inject(AuthService);
}
