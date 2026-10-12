import { randomUUID } from "crypto";
import { isAuthorized } from "@/lib/auth";
import { bucket, isValidId, objectName, PREFIX } from "@/lib/storage";

export const dynamic = "force-dynamic";

const unauthorized = () => Response.json({ error: "No autorizado" }, { status: 401 });

/** POST: crea un comprobante sintético en Cloud Storage y lo relee desde el bucket. */
export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  try {
    const id = randomUUID();
    const name = objectName(id);
    const comprobante = {
      id,
      etiqueta: "Datos de demostración",
      descripcion: "Venta de 10 aguas a Q5 (comprobante sintético)",
      total_gtq: 50,
      creado: new Date().toISOString(),
    };
    const file = bucket().file(name);
    await file.save(JSON.stringify(comprobante), { contentType: "application/json" });
    const [contenido] = await file.download(); // lectura real desde el bucket
    console.log(JSON.stringify({ severity: "INFO", message: "comprobante creado", objeto: name }));
    return Response.json({ ok: true, objeto: name, comprobante: JSON.parse(contenido.toString()) }, { status: 201 });
  } catch (err) {
    console.error(JSON.stringify({ severity: "ERROR", message: "fallo al crear comprobante", detalle: String(err) }));
    return Response.json({ ok: false, error: "No se pudo escribir en Cloud Storage" }, { status: 500 });
  }
}

/**
 * GET sin parámetros: lista los comprobantes del bucket (los 20 más recientes).
 * GET ?id=<uuid>: recupera un comprobante a través del backend.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) return unauthorized();
  const parametro = new URL(req.url).searchParams.get("id");
  if (parametro === null) return listar();
  const id = parametro;
  if (!isValidId(id)) return Response.json({ error: "Identificador inválido" }, { status: 400 });
  try {
    const file = bucket().file(objectName(id));
    const [existe] = await file.exists();
    if (!existe) return Response.json({ error: "No encontrado" }, { status: 404 });
    const [contenido] = await file.download();
    return Response.json({ ok: true, objeto: objectName(id), comprobante: JSON.parse(contenido.toString()) });
  } catch (err) {
    console.error(JSON.stringify({ severity: "ERROR", message: "fallo al leer comprobante", detalle: String(err) }));
    return Response.json({ ok: false, error: "No se pudo leer de Cloud Storage" }, { status: 500 });
  }
}

// Límite de la demo: se leen hasta 100 objetos y se muestran los 20 más recientes.
async function listar() {
  try {
    const [archivos] = await bucket().getFiles({ prefix: PREFIX, maxResults: 100 });
    const items = archivos
      .filter((f) => f.name.endsWith(".json"))
      .map((f) => ({
        id: f.name.slice(PREFIX.length, -".json".length),
        objeto: f.name,
        creado: String(f.metadata.timeCreated ?? ""),
        bytes: Number(f.metadata.size ?? 0),
      }))
      .sort((a, b) => b.creado.localeCompare(a.creado))
      .slice(0, 20);
    return Response.json({ ok: true, items });
  } catch (err) {
    console.error(JSON.stringify({ severity: "ERROR", message: "fallo al listar comprobantes", detalle: String(err) }));
    return Response.json({ ok: false, error: "No se pudo listar Cloud Storage" }, { status: 500 });
  }
}
