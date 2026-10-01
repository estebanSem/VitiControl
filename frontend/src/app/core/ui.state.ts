import { Injectable, signal } from "@angular/core";

@Injectable({ providedIn: "root" })
export class UiState {
  busy = signal(false);

  error = signal("");

  toast = signal("");

  notify(s: string) {
    this.toast.set(s);
    setTimeout(() => this.toast.set(""), 4000);
  }
}
