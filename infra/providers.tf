terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = "prod"
      ManagedBy   = "Terraform"
      Owner       = "V3ND377A 5Y573M5"
      CostCenter  = "FreeTier"
    }
  }
}

provider "aws" {
  alias  = "acm"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project
      Environment = "prod"
      ManagedBy   = "Terraform"
      Owner       = "V3ND377A 5Y573M5"
      CostCenter  = "FreeTier"
    }
  }
}
