# Despliegue paso a paso (Cloud Run + Cloud Storage)

Requisitos: la titular de la cuenta GCP ya creó el proyecto, activó facturación y agregó a cada integrante con permisos individuales. No compartir contraseñas ni subir claves.

## 0. Variables (ajustar; la región debe verificarse y documentarse)

```bash
export PROJECT_ID=ID_DEL_PROYECTO
export REGION=us-central1
export BUCKET=${PROJECT_ID}-comprobantes
export SA=sa-app-negocios
gcloud config set project $PROJECT_ID
```

## 1. Presupuesto y alertas (antes de crear recursos)

Consola > Facturación > Presupuestos y alertas. Objetivo propuesto USD 50/mes con avisos al 50, 80 y 100%. Una alerta no corta el consumo. Verificar contra la calculadora oficial.

## 2. Activar APIs

```bash
gcloud services enable run.googleapis.com storage.googleapis.com \
  cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

## 3. Bucket privado

```bash
gcloud storage buckets create gs://$BUCKET --location=$REGION \
  --uniform-bucket-level-access --public-access-prevention
```

## 4. Cuenta de servicio con permisos mínimos

```bash
gcloud iam service-accounts create $SA --display-name="App negocios (Cloud Run)"
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member="serviceAccount:$SA@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectUser"
```

El rol se asigna solo sobre este bucket. No asignar Owner ni Editor. Documentar el rol en el PDF.

## 5. Token de la demo en Secret Manager

```bash
openssl rand -base64 32 | tr -d '\n' | gcloud secrets create demo-token --data-file=-
gcloud secrets add-iam-policy-binding demo-token \
  --member="serviceAccount:$SA@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Para leer el token y usarlo en la pantalla: `gcloud secrets versions access latest --secret=demo-token`.

## 6. Desplegar en Cloud Run

```bash
gcloud run deploy asistente-negocios --source . --region $REGION \
  --service-account $SA@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=$REGION,GCS_BUCKET=$BUCKET \
  --set-secrets DEMO_TOKEN=demo-token:latest \
  --min-instances 0 --max-instances 2 --allow-unauthenticated
```

`--allow-unauthenticated` solo permite abrir la página. La escritura y la lectura de comprobantes exigen el token, validado en el servidor.

Nota: `--source` usa Cloud Build y Artifact Registry internamente, pero eso no cuenta como integración de Cloud Build hasta tener `cloudbuild.yaml` versionado y una ejecución vinculada al código.

## 7. Verificar (qué salida demuestra éxito)

```bash
URL=$(gcloud run services describe asistente-negocios --region $REGION --format='value(status.url)')
TOKEN=$(gcloud secrets versions access latest --secret=demo-token)
curl $URL/api/health                      # {"status":"ok",...}
curl -X POST -H "Authorization: Bearer $TOKEN" $URL/api/comprobantes   # 201 con "objeto"
curl -X POST $URL/api/comprobantes        # 401 (sin token)
gcloud storage ls gs://$BUCKET/comprobantes-demo/   # el objeto aparece
gcloud logging read 'resource.type="cloud_run_revision" AND textPayload!=""' --limit 5
```

Todo lo anterior (pruebas 1 a 7) se puede ejecutar de una vez con el script del proyecto, en Cloud Shell y desde la carpeta que contiene `package.json`:

```bash
URL=$URL BUCKET=$BUCKET bash scripts/verificar-m2.sh
```
Pide el token sin mostrarlo y termina con `RESULTADO: todas las pruebas pasaron` si todo funciona. Guarda esa salida como evidencia.

## 8. Evidencias a guardar (sin secretos)

Fecha y commit (`git rev-parse HEAD`); ID del proyecto (sin datos de facturación); revisión y URL de Cloud Run; pantalla con éxito; bucket con el objeto; IAM del bucket y de la cuenta de servicio; log de la solicitud; resultado tras refrescar y repetir la lectura. Ocultar tokens en las capturas.
