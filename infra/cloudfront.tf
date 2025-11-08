# Origin Access Control (OAC)
resource "aws_cloudfront_origin_access_control" "frontend_oac" {
  name                              = "${var.project}-oac"
  description                       = "OAC for secure S3 access"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend_cdn" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.frontend.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
  }

  default_cache_behavior {
    target_origin_id       = "S3-${aws_s3_bucket.frontend.id}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  #  aliases = ["survey.statwox.in"]

  tags = {
    Project = var.project
  }
}

# Route53 Alias Record → survey.statwox.in
#resource "aws_route53_record" "frontend_alias" {
#  zone_id = data.aws_route53_zone.primary.zone_id
#  name    = "survey.statwox.in"
#  type    = "A"
#
#  alias {
#    name                   = aws_cloudfront_distribution.frontend_cdn.domain_name
#    zone_id                = aws_cloudfront_distribution.frontend_cdn.hosted_zone_id
#    evaluate_target_health = false
#  }
#}

# Output for CloudFront Domain
output "cloudfront_url" {
  value = aws_cloudfront_distribution.frontend_cdn.domain_name
}

