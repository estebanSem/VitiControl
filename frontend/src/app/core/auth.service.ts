import { errorMessage } from "./errors";
import { Injectable, inject } from "@angular/core";
import { ApiService } from "./http.service";
import { NotebookStore } from "./notebook.store";
import { SessionState } from "./session.state";
import { UiState } from "./ui.state";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(ApiService);
  private readonly session = inject(SessionState);
  private readonly notebook = inject(NotebookStore);
  private readonly ui = inject(UiState);
  user = "admin";

  password = "";

  async checkSession() {
    try {
      await this.http.api("/me");
      this.session.logged.set(true);
      await this.notebook.reload();
    } catch {
    } finally {
      this.session.loading.set(false);
    }
  }

  async login() {
    this.ui.busy.set(true);
    this.ui.error.set("");
    try {
      await this.http.api("/login", "POST", {
        username: this.user,
        password: this.password,
      });
      this.session.logged.set(true);
      this.password = "";
      await this.notebook.reload();
    } catch (e: unknown) {
      this.ui.error.set(errorMessage(e));
    } finally {
      this.ui.busy.set(false);
    }
  }

  async logout() {
    try {
      await this.http.api("/logout", "POST");
      this.session.logged.set(false);
      this.notebook.data.set({ parcels: [], records: [], campaigns: [] });
    } catch (e: unknown) {
      this.ui.error.set(errorMessage(e));
    }
  }
}
