import { Injectable, inject } from "@angular/core";
import { SessionState } from "./session.state";

@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly session = inject(SessionState);
  async api<T = unknown>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    const r = await fetch("/api" + path, {
      method,
      credentials: "same-origin",
      headers:
        body instanceof FormData ? {} : { "Content-Type": "application/json" },
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
    if (!r.ok) {
      let e: { detail?: string | { msg: string }[] } = {};
      try {
        e = await r.json();
      } catch {}
      if (r.status === 401) this.session.logged.set(false);
      throw new Error(
        typeof e.detail === "string"
          ? e.detail
          : Array.isArray(e.detail)
            ? e.detail.map((x) => x.msg).join(". ")
            : "No se pudo completar la operación",
      );
    }
    return r.status === 204 ? (null as T) : (r.json() as Promise<T>);
  }
}
