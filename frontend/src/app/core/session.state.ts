import { Injectable, signal } from "@angular/core";
import { environment } from "../../environment";

@Injectable({ providedIn: "root" })
export class SessionState {
  demo = environment.demo;

  logged = signal(environment.demo);

  loading = signal(!environment.demo);
}
