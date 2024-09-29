terraform {
  backend "gcs" {
    bucket                      = "tf-launchbay-bigcommerce-production"
    prefix                      = "/b2b-buyer-portal"
  }
  required_version = ">= 1.5.0"
}
