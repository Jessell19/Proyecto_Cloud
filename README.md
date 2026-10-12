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
- `GET /api/comprobantes`: lista los 20 comprobantes más recientes del bucket.
- `GET /api/comprobantes?id=<uuid>`: recupera el comprobante vía backend.
- `GET /api/estado` (con token): comprueba en vivo si corre en Cloud Run y si el bucket responde. Alimenta la pantalla `/estado`.
- Pantallas `/comprobantes` (crear, listar y ver recibo) y `/estado` (siete servicios con estado real). El token se escribe en el encabezado, solo vive en memoria y hay que volver a escribirlo al recargar.
- Sin claves JSON: usa la identidad de la cuenta de servicio (ADC).

## Versiones y seguridad (revisado el 11/10/2026)

- Se subió de Next.js 14.2.15 a **16.4.0** (con React 19.3.0): `npm audit` marcaba la 14.2.x con avisos críticos y la 16.4.0 es la versión que corrige los de la línea 16. Node 22 en el Dockerfile.
- `images.unoptimized` activado: la app no usa el optimizador de imágenes de Next.
- Quedan 5 avisos de severidad **moderada** en dependencias indirectas de `@google-cloud/storage` 7.x (uuid, teeny-request, etc.). La corrección está en la 8.x, que exige Node 22 y se publicó hace pocos días; se evalúa tras M2. Aquí no se usan las funciones afectadas.
- Volver a revisar con `npm audit --omit=dev` antes de cada entrega.

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
