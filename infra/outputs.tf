output "bucket_name" {
  description = "Name of the R2 bucket"
  value       = cloudflare_r2_bucket.images.name
}

output "public_url" {
  description = "Public URL for accessing images"
  value       = "https://${var.custom_domain}"
}
