variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with R2 and DNS permissions"
  type        = string
  sensitive   = true
}

variable "zone_id" {
  description = "Cloudflare zone ID for cppserbia.org"
  type        = string
}

variable "custom_domain" {
  description = "Custom domain for serving images"
  type        = string
  default     = "images.cppserbia.org"
}
