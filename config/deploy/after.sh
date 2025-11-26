#!/usr/bin/env bash

if [[ $ENVIRONMENT =~ "integration" ]]; then
  CDN_BASE_URL="https://microapps.integration.zone"
elif [[ $ENVIRONMENT =~ "staging" ]]; then
  CDN_BASE_URL="https://microapps.staging.zone"
elif [[ $ENVIRONMENT =~ "production-tier1" ]]; then
  CDN_BASE_URL="https://microapps.bigcommerce.com"
elif [[ $ENVIRONMENT =~ "production" ]]; then
  CDN_BASE_URL="https://microapps.bigcommerce.com"
fi

REVISION_TITLE="${SHA}-$(date +%s)"

index_js=$(jq -r '."src/main.ts".file' .vite/manifest.json)
poly_js=$(jq -r '."vite/legacy-polyfills-legacy".file' .vite/manifest.json)
index_legacy_js=$(jq -r '."src/main-legacy.ts".file' .vite/manifest.json)

if [[ ! -f "${index_js}" ]]; then
  echo "Error: ${index_js} not found!"
  exit 1
fi

if [[ ! -f "${poly_js}" ]]; then
  echo "Error: ${poly_js} not found!"
  exit 1
fi

if [[ ! -f "${index_legacy_js}" ]]; then
  echo "Error: ${index_legacy_js} not found!"
  exit 1
fi

index_js_sri=$(openssl dgst -sha384 -binary "${index_js}" | openssl base64 -A)
poly_js_sri=$(openssl dgst -sha384 -binary "${poly_js}" | openssl base64 -A)
index_legacy_js_sri=$(openssl dgst -sha384 -binary "${index_legacy_js}" | openssl base64 -A)

tee create_revision_payload.json <<EOF >/dev/null
{
  "jsFiles": [
    "<script type=\"module\" crossorigin integrity=\"sha384-${index_js_sri}\" src=\"$CDN_BASE_URL/b2b-buyer-portal/${index_js}\"></script>",
    "<script nomodule crossorigin integrity=\"sha384-${poly_js_sri}\" src=\"$CDN_BASE_URL/b2b-buyer-portal/${poly_js}\"></script>",
    "<script nomodule crossorigin integrity=\"sha384-${index_legacy_js_sri}\" src=\"$CDN_BASE_URL/b2b-buyer-portal/${index_legacy_js}\"></script>"
  ],
  "revisionTitle": "${REVISION_TITLE}"
}
EOF

cat <<EOF > deploy_revision_payload.json 
{
  "deploy_all": true,
  "revision": "${REVISION_TITLE}"
}
EOF

# create revision
curl --location --request POST "$B2B_API_BASE_URL/api/v3/stores/revisions" \
  --header "Authorization: Basic $B2B_API_DEPLOY_CREDENTIAL" \
  --header 'Content-Type: application/json' \
  --data-binary @create_revision_payload.json

# apply the revision
curl --location --request POST "$B2B_API_BASE_URL/api/v3/stores/deployments" \
  --header "Authorization: Basic $B2B_API_DEPLOY_CREDENTIAL" \
  --header 'Content-Type: application/json' \
  --data-binary @deploy_revision_payload.json

rm {create,deploy}_revision_payload.json
