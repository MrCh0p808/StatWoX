# ===========================
# ✅ Terraform Variables
# ===========================
# These variables DO NOT contain defaults for sensitive data.
# Values MUST come from environment variables like:
#   export TF_VAR_sheet_id="xxx"
#   export TF_VAR_google_service_creds="json"
#
# direnv loads them automatically from .envrc

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region to deploy StatWoX infra"
}

variable "project" {
  type        = string
  default     = "statwox"
  description = "Project name prefix for resources"
}

variable "sheet_id" {
  type        = string
  description = "Google Sheet ID (provided via TF_VAR_sheet_id env var)"
}

variable "google_service_creds" {
  type        = string
  description = "Google Service Account JSON (TF_VAR_google_service_creds env var)"
}
