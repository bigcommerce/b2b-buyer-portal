#!/usr/bin/env bash

if [[ $ENVIRONMENT =~ "integration" ]]
then
  CDN_BASE_URL="https://microapp-cdn.gcp.integration.zone"
elif [[ $ENVIRONMENT =~ "staging" ]]
then
  CDN_BASE_URL="https://microapp-cdn.gcp.staging.zone"
elif [[ $ENVIRONMENT =~ "production" ]]
then
  CDN_BASE_URL="https://microapps.bigcommerce.com"
fi

REVISION_TITLE="$REVISION-$(date '%d-%m-%Y-%H:%M:%S')"

index_js=$(find ./dist -name "index.*.js" ! -path "./dist/assets/*" -type f -printf '%f')
poly_js=$(find ./dist -name "polyfills-legacy.*.js" -type f -printf '%f')
index_legacy_js=$(find ./dist -name "index-legacy.*.js" ! -path "./assets/*" -type f -printf '%f')

tee create_revision_payload.json <<EOF
{
  "jsFiles": [
    "<script type=\"module\" crossorigin src=\"$CDN_BASE_URL/b2b-buyer-portal/${index_js}\"></script>",
    "<script nomodule crossorigin src=\"$CDN_BASE_URL/b2b-buyer-portal/${poly_js}\"></script>",
    "<script nomodule crossorigin src=\"$CDN_BASE_URL/b2b-buyer-portal/${index_legacy_js}\"></script>"
  ],
  "revisionTitle": "${REVISION_TITLE}"
}
EOF

cat create_revision_payload.json

if [[ $ENVIRONMENT =~ "production-tier1" ]]
then
tee deploy_revision_payload.json << EOF
{
"deploy_all": false,
"store_hashes": $(cat deployment/production-tier1.json),
"revision": "${REVISION_TITLE}"
}
EOF
else
tee deploy_revision_payload.json << EOF
{
"deploy_all": true,
"revision": "${REVISION_TITLE}"
}
EOF
fi

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
