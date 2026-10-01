import { Injectable, inject } from "@angular/core";
import { ApiService } from "./http.service";
import { SessionState } from "./session.state";

@Injectable({ providedIn: "root" })
export class PhotoService {
  private readonly session = inject(SessionState);
  private readonly http = inject(ApiService);
  async savePhoto(id: number, file: File) {
    if (this.session.demo) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw new Error("Utiliza JPEG, PNG o WebP.");
      const url = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const list = JSON.parse(
        localStorage.getItem("viti-photos-" + id) || "[]",
      );
      list.push({ id: Date.now(), url });
      localStorage.setItem("viti-photos-" + id, JSON.stringify(list));
    } else {
      const form = new FormData();
      form.append("file", file);
      await this.http.api("/records/" + id + "/photos", "POST", form);
    }
  }
}
