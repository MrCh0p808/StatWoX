# ===========================
# Terraform Variables
# ===========================
# No Variable with sensitive data
# Values must be provided via terraform.tfvars, TF_VAR_*,
# or CI secrets. Do NOT rely on .envrc in production.


variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region to deploy StatWoX infra"
}

variable "project" {
  type        = string
  default     = "StatWoX_v1"
  description = "Project name prefix for resources"
}

variable "db_username" {
  type        = string
  sensitive   = true
  description = "Database master username"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Database master password"
}

variable "jwt_secret" {
  type        = string
  sensitive   = true
  description = "The secret key for signing JWTs."
}



variable "google_client_id" {
  type        = string
  description = "Google OAuth Client ID"
}

variable "allowed_origins" {
  type        = list(string)
  default     = ["*"]
  description = "CORS allowed origins (e.g. CloudFront domain)"
}

variable "domain_name" {
  type        = string
  default     = "statwox.ttoxtech.in"
  description = "Domain name for the application"
}
