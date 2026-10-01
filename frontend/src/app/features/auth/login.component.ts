import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { AuthService } from "../../core/auth.service";
import { UiState } from "../../core/ui.state";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: "./login.component.html",
  host: { style: "display: contents" },
})
export class LoginComponent {
  readonly ui = inject(UiState);
  readonly auth = inject(AuthService);
}
