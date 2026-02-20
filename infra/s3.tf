resource "aws_s3_bucket" "frontend" {
  bucket = local.bucket_name
  #  lifecycle { prevent_destroy = true }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  ignore_public_acls      = true
  restrict_public_buckets = true
  block_public_policy     = false
}

resource "aws_s3_bucket_ownership_controls" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  rule { object_ownership = "BucketOwnerEnforced" }
}
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipalReadOnly",
        Effect = "Allow",
        Principal = {
          Service = "cloudfront.amazonaws.com"
        },
        Action   = "s3:GetObject",
        Resource = ["${aws_s3_bucket.frontend.arn}/*"],
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend_cdn.arn
          }
        }
      }
    ]
  })
}

# Upload entire frontend/dist directory

locals {
  frontend_dist_dir = "${path.module}/../dist/assets"
  frontend_files    = fileset(local.frontend_dist_dir, "**")
}

resource "aws_s3_object" "frontend_dist" {
  for_each = { for f in local.frontend_files : f => f }

  bucket = aws_s3_bucket.frontend.id
  key    = each.key
  source = "${local.frontend_dist_dir}/${each.key}"

  content_type = lookup({
    html = "text/html",
    js   = "application/javascript",
    css  = "text/css",
    json = "application/json",
    png  = "image/png",
    jpg  = "image/jpeg",
    svg  = "image/svg+xml",
    ico  = "image/x-icon"
  }, split(".", each.key)[length(split(".", each.key)) - 1], "binary/octet-stream")

  server_side_encryption = "AES256"
  storage_class          = "STANDARD"

  tags = {
    ManagedBy   = "Terraform"
    Project     = "statwox"
    Environment = "prod"
    Owner       = "V3ND377A 5Y573M5"
    CostCenter  = "FreeTier"
  }
}
