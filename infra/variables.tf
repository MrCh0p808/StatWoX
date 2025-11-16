# ===========================
# Terraform Variables
# ===========================
# No Variable with sensitive data
# Values gets fetched from Enviroment Variables
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

variable "DATABASE_URL" {
  type        = string
  sensitive   = true
  description = "The connection string for the production database."
}

variable "JWT_SECRET" {
  type        = string
  sensitive   = true
  description = "The secret key for signing JWTs."
}
