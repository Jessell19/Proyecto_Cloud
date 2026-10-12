import { isAuthorized } from "@/lib/auth";
import { bucket, PREFIX } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Estado real de lo desplegado. Cloud Run define K_SERVICE y K_REVISION automáticamente. */
export async function GET(req: Request) {
  if (!isAuthorized(req)) return Response.json({ error: "No autorizado" }, { status: 401 });

  let storageOk = false;
  try {
    await bucket().getFiles({ prefix: PREFIX, maxResults: 1 }); // prueba real de acceso
    storageOk = true;
  } catch (err) {
    console.error(JSON.stringify({ severity: "WARNING", message: "estado: Storage inaccesible", detalle: String(err) }));
  }

  return Response.json({
    cloudRun: {
      activo: Boolean(process.env.K_SERVICE),
      servicio: process.env.K_SERVICE ?? null,
      revision: process.env.K_REVISION ?? null,
      region: process.env.GOOGLE_CLOUD_LOCATION ?? null,
    },
    storage: { ok: storageOk, bucket: process.env.GCS_BUCKET ?? null },
    consultado: new Date().toISOString(),
  });
}
