# Asistente de gestión para pequeños negocios guatemaltecos (nombre provisional)

Proyecto del curso Cloud, Universidad Galileo (FISICC). Proveedor: Google Cloud.

## Estado real (actualizar con fecha y commit)

| Servicio | Función | Estado |
|---|---|---|
| Cloud Run | Frontend y backend | Código listo; **despliegue pendiente** |
| Cloud Storage | Comprobantes en bucket privado | Código listo; **integración pendiente de comprobar** |
| IAM | Cuenta de servicio con permisos mínimos | Comandos listos; **pendiente de configurar** |
| Cloud SQL, Vertex AI, Monitoring/Logging, Cloud Build | Ver `pendientes.md` | Planeado |

Nada de esto cumple M2 hasta que existan la URL de Cloud Run, el objeto en el bucket y las evidencias.

## Qué incluye

- `GET /api/health`: responde sin datos sensibles.
- `POST /api/comprobantes`: exige `Authorization: Bearer <DEMO_TOKEN>`, escribe un comprobante sintético (UUID único) en Cloud Storage y lo relee.
- `GET /api/comprobantes?id=<uuid>`: recupera el comprobante vía backend.
- Pantalla `/comprobantes` para probarlo. El token se escribe a mano y no se guarda en el navegador.
- Sin claves JSON: usa la identidad de la cuenta de servicio (ADC).

## Desarrollo local

```bash
cp .env.example .env.local      # completar valores; no subir a Git
npm install
gcloud auth application-default login   # solo local; permisos al bucket de pruebas
npm run dev
```

Prueba:

```bash
curl localhost:3000/api/health
curl -X POST -H "Authorization: Bearer $DEMO_TOKEN" localhost:3000/api/comprobantes
```

Despliegue: ver `docs/despliegue.md`.
