import { Storage } from "@google-cloud/storage";

// En Cloud Run usa la identidad de la cuenta de servicio (ADC). No hay claves en el código.
const storage = new Storage({ projectId: process.env.GOOGLE_CLOUD_PROJECT });

export const PREFIX = "comprobantes-demo/";
const ID_RE = /^[a-f0-9-]{36}$/; // UUID v4

export function bucket() {
  const name = process.env.GCS_BUCKET;
  if (!name) throw new Error("GCS_BUCKET no está configurado");
  return storage.bucket(name);
}

export function isValidId(id: string): boolean {
  return ID_RE.test(id);
}

export function objectName(id: string): string {
  return `${PREFIX}${id}.json`;
}
