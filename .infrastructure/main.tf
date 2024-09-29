locals {
  service_name          = "b2b-buyer-portal"
  language              = "javascript-react"
  canonical_branch_name = "main"
  github_repository     = "b2b-buyer-portal"
  organization          = "bigcommerce"
  team                  = "b2b"
}

module "service" {
  source                        = "git@github.com:bigcommerce/terraform-services-modules.git//modules/service"
  name                          = local.service_name
  description                   = "B2B Buyer Portal"
  playbook_url                  = "https://docs.dev.bigcommerce.net/domains/customers/playbooks/doesntexistyet.html"
  operating_type                = "global"
  service_type                  = "frontend"
  language                      = "javascript"
  framework                     = "react-microapp"
  release_process_documentation = "https://github.com/bigcommerce/b2b-buyer-portal"

  integration_us_branch_target         = true
  canaries                             = false
  canaries_auto_promote                = false
  deployment_strategy                  = "js-app"
  seconds_on_staging_before_production = 1
  notify_sentry                        = true

  owners = [{ name = "team-b2b" }]

  slack = {
    team     = "team-b2b"
    channels = [
      "#b2b-alerts",
    ],
    deployment_notification_channels = [
      "#deployments",
    ]
  }

  github = {
    repository            = local.github_repository
    organization          = local.organization
    canonical_branch_name = local.canonical_branch_name
  }

  grafana = {
    links = {}
  }

  kibana = {
    links = {}
  }
}
