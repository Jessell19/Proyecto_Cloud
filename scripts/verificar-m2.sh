#!/usr/bin/env bash
# Verifica las pruebas 1-7 de M2 contra el servicio ya desplegado.
# Ejecutar en Cloud Shell (Bash), desde la carpeta del proyecto:
#   URL=https://TU-SERVICIO.run.app BUCKET=nombre-del-bucket bash scripts/verificar-m2.sh
# El token se pide sin mostrarse en pantalla; no se imprime ni se guarda.
set -u
: "${URL:?Falta URL (la URL de Cloud Run)}"
: "${BUCKET:?Falta BUCKET (nombre del bucket, sin gs://)}"
if [ -z "${TOKEN:-}" ]; then read -r -s -p "Token de la demo: " TOKEN; echo; fi
FALLAS=0
ok()   { echo "OK     - $1"; }
falla() { echo "FALLA  - $1"; FALLAS=$((FALLAS+1)); }
codigo() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

echo "== Prueba 1: /api/health"
[ "$(codigo "$URL/api/health")" = "200" ] && ok "health responde 200" || falla "health no responde 200"

echo "== Prueba 2: POST sin token se rechaza"
[ "$(codigo -X POST "$URL/api/comprobantes")" = "401" ] && ok "401 sin token" || falla "esperaba 401"

echo "== Prueba 3: POST con token crea el comprobante"
RESP=$(curl -s -w "\n%{http_code}" -X POST -H "Authorization: Bearer $TOKEN" "$URL/api/comprobantes")
CODE=$(echo "$RESP" | tail -n1); BODY=$(echo "$RESP" | sed '$d')
ID=""; OBJ=""
if [ "$CODE" = "201" ]; then
  ID=$(echo "$BODY"  | python3 -c "import sys,json; print(json.load(sys.stdin)['comprobante']['id'])")
  OBJ=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['objeto'])")
  ok "201 creado. id=$ID objeto=$OBJ"
else
  falla "esperaba 201, recibi $CODE"
fi

if [ -n "$OBJ" ]; then
  echo "== Prueba 4: el objeto existe en el bucket privado"
  gcloud storage ls "gs://$BUCKET/$OBJ" >/dev/null 2>&1 && ok "objeto visible en gs://$BUCKET/$OBJ" || falla "objeto no encontrado en el bucket"

  echo "== Prueba 5: lectura posterior por el mismo ID"
  R2=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$URL/api/comprobantes?id=$ID")
  C2=$(echo "$R2" | tail -n1); B2=$(echo "$R2" | sed '$d')
  ID2=$(echo "$B2" | python3 -c "import sys,json; print(json.load(sys.stdin)['comprobante']['id'])" 2>/dev/null)
  [ "$C2" = "200" ] && [ "$ID2" = "$ID" ] && ok "200 y mismo id" || falla "lectura: codigo $C2, id devuelto '$ID2'"

  echo "== Prueba 6: lectura sin token y bucket no publico"
  [ "$(codigo "$URL/api/comprobantes?id=$ID")" = "401" ] && ok "401 sin token en lectura" || falla "lectura sin token no dio 401"
  PAP=$(gcloud storage buckets describe "gs://$BUCKET" --format="value(iamConfiguration.publicAccessPrevention)" 2>/dev/null)
  [ "$PAP" = "enforced" ] && ok "prevencion de acceso publico: enforced" || falla "publicAccessPrevention = '$PAP' (se esperaba enforced)"
  PUB=$(codigo "https://storage.googleapis.com/$BUCKET/$OBJ")
  [ "$PUB" != "200" ] && ok "acceso anonimo directo al objeto rechazado ($PUB)" || falla "el objeto es accesible publicamente"

  echo "== Prueba 7: log de la operacion (puede tardar unos segundos)"
  ENCONTRADO=""
  for i in 1 2 3 4 5 6; do
    L=$(gcloud logging read "resource.type=\"cloud_run_revision\" AND jsonPayload.objeto=\"$OBJ\"" --limit=1 --format="value(timestamp,jsonPayload.message)" 2>/dev/null)
    if [ -n "$L" ]; then ENCONTRADO="$L"; break; fi; sleep 10
  done
  [ -n "$ENCONTRADO" ] && ok "log encontrado: $ENCONTRADO" || falla "no se encontro el log (revisar Logs Explorer)"
fi

echo
[ "$FALLAS" -eq 0 ] && echo "RESULTADO: todas las pruebas pasaron. Guarda esta salida como evidencia (sin el token)." || echo "RESULTADO: $FALLAS prueba(s) fallaron. No marcar M2 como cumplido."
exit "$FALLAS"
