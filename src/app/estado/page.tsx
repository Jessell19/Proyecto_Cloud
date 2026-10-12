"use client";

import { useState } from "react";
import { useToken } from "../token-context";

type Estado = {
  cloudRun: { activo: boolean; servicio: string | null; revision: string | null; region: string | null };
  storage: { ok: boolean; bucket: string | null };
  consultado: string;
};

type Fila = { servicio: string; funcion: string; estado: string; clase: "ok" | "falla" | "plan"; detalle?: string };

function filas(e: Estado | null): Fila[] {
  const cr: Fila = e?.cloudRun.activo
    ? { servicio: "Cloud Run", funcion: "Frontend y backend", estado: "Desplegado", clase: "ok", detalle: `${e.cloudRun.servicio} · revisión ${e.cloudRun.revision}` }
    : { servicio: "Cloud Run", funcion: "Frontend y backend", estado: e ? "No (esta app corre en local)" : "Sin consultar", clase: "plan" };
  const st: Fila = !e
    ? { servicio: "Cloud Storage", funcion: "Comprobantes en bucket privado", estado: "Sin consultar", clase: "plan" }
    : e.storage.ok
      ? { servicio: "Cloud Storage", funcion: "Comprobantes en bucket privado", estado: "Integrado: el backend accede al bucket", clase: "ok", detalle: e.storage.bucket ?? undefined }
      : { servicio: "Cloud Storage", funcion: "Comprobantes en bucket privado", estado: "Sin acceso al bucket", clase: "falla", detalle: "Revisa GCS_BUCKET y los permisos de la identidad" };
  return [
    cr,
    st,
    { servicio: "IAM", funcion: "Cuenta de servicio con permisos mínimos", estado: "Pendiente de documentar", clase: "plan" },
    { servicio: "Cloud SQL (PostgreSQL)", funcion: "Negocios, productos y movimientos", estado: "Planeado", clase: "plan" },
    { servicio: "Vertex AI / Gemini", funcion: "Interpretar texto en propuestas", estado: "Planeado", clase: "plan" },
    { servicio: "Monitoring / Logging", funcion: "Observabilidad", estado: "Planeado", clase: "plan" },
    { servicio: "Cloud Build", funcion: "Compilar y desplegar", estado: "Planeado", clase: "plan" },
  ];
}

export default function EstadoServicios() {
  const { token } = useToken();
  const [estado, setEstado] = useState<Estado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function consultar() {
    setOcupado(true);
    setError(null);
    try {
      const res = await fetch("/api/estado", { headers: { Authorization: `Bearer ${token}` } });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error ?? `Error ${res.status}`);
      setEstado(datos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo contactar al servidor. Revisa tu conexión.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <h1>Estado de los servicios</h1>
      <p>
        Los dos primeros se comprueban en vivo desde el servidor. El resto aparece como planeado hasta
        que exista una integración demostrable.
      </p>
      <button onClick={consultar} disabled={ocupado || token.length === 0}>
        {ocupado ? "Consultando…" : "Consultar estado"}
      </button>
      {token.length === 0 && <p className="aviso">Escribe el token de la demo en la parte superior.</p>}
      <div aria-live="polite">
        {error && (
          <div className="resultado error"><strong>No se pudo consultar.</strong><p>{error}</p></div>
        )}
      </div>
      <div className="tabla-scroll">
        <table>
          <thead><tr><th>Servicio</th><th>Función</th><th>Estado</th></tr></thead>
          <tbody>
            {filas(estado).map((f) => (
              <tr key={f.servicio}>
                <td>{f.servicio}</td>
                <td>{f.funcion}</td>
                <td>
                  <span className={`insignia ${f.clase}`}>{f.estado}</span>
                  {f.detalle && <div className="detalle">{f.detalle}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {estado && <p className="detalle">Consultado: {new Date(estado.consultado).toLocaleString("es-GT", { timeZone: "America/Guatemala" })}</p>}
    </>
  );
}
