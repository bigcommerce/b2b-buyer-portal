# Staging regression suite

module "staging_run_suite_staging_b2b_e2e_suite" {
  source     = "git@github.com:bigcommerce/terraform-services-modules.git//modules/run_regression_suite_from_other_project"
  project_id = module.service.id
  target_ids = [
    module.service.target_ids["staging-us"]
  ]
  other_project_name = "functional-tests"
  other_target_name  = "staging"
  profile_name       = "staging_b2b_e2e_suite"
  delay_in_seconds   = 0
}

# Production regression suite

module "production_require_suite_staging_b2b_e2e_suite" {
  source     = "git@github.com:bigcommerce/terraform-services-modules.git//modules/require_regression_suite_from_another_project"
  project_id = module.service.id
  target_ids = [
    module.service.target_ids["production-us"]
  ]
  other_project_name = "functional-tests"
  other_target_name  = "staging"
  profile_name       = "staging_b2b_e2e_suite"
}
