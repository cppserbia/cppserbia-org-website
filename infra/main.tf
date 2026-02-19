terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# R2 bucket for hosting event images
resource "cloudflare_r2_bucket" "images" {
  account_id = var.cloudflare_account_id
  name       = "cppserbia-images"
  location   = "EEUR"
}

# Custom domain for public access to the R2 bucket
resource "cloudflare_r2_custom_domain" "images" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.images.name
  domain      = var.custom_domain
  zone_id     = var.zone_id
  enabled     = true
}
