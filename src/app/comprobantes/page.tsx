"use client";

import { useState } from "react";

type Estado =
  | { tipo: "inactivo" }
  | { tipo: "cargando" }
  | { tipo: "ok"; objeto: string; cuerpo: unknown }
  | { tipo: "error"; mensaje: string };

export default function Comprobantes() {
  const [token, setToken] = useState(""); // solo en memoria; no se guarda en el navegador
  const [estado, setEstado] = useState<Estado>({ tipo: "inactivo" });

  async function crear() {
    setEstado({ tipo: "cargando" });
    try {
      const res = await fetch("/api/comprobantes", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const datos = await res.json();
      if (res.ok) setEstado({ tipo: "ok", objeto: datos.objeto, cuerpo: datos.comprobante });
      else setEstado({ tipo: "error", mensaje: datos.error ?? `Error ${res.status}` });
    } catch {
      setEstado({ tipo: "error", mensaje: "No se pudo contactar al servidor. Revisa tu conexión." });
    }
  }

  return (
    <>
      <span className="etiqueta-demo">Datos de demostración</span>
      <h1>Comprobantes de prueba</h1>
      <p>
        Crea un comprobante sintético. El servidor lo guarda en Cloud Storage y lo vuelve a leer
        desde el bucket para confirmar que funcionó.
      </p>
      <label htmlFor="token">Token de la demo</label>
      <input
        id="token"
        type="password"
        autoComplete="off"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <button onClick={crear} disabled={estado.tipo === "cargando" || token.length === 0}>
        {estado.tipo === "cargando" ? "Guardando…" : "Crear comprobante de prueba"}
      </button>

      <div aria-live="polite">
        {estado.tipo === "ok" && (
          <div className="resultado ok">
            <strong>Comprobante guardado y leído desde el bucket.</strong>
            <p>Objeto: <code>{estado.objeto}</code></p>
            <pre>{JSON.stringify(estado.cuerpo, null, 2)}</pre>
          </div>
        )}
        {estado.tipo === "error" && (
          <div className="resultado error">
            <strong>No se pudo crear el comprobante.</strong>
            <p>{estado.mensaje}</p>
          </div>
        )}
      </div>
    </>
  );
}
