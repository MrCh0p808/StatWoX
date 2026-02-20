# Origin Access Control (OAC)
# This is like a security guard for my S3 bucket.
# It ensures that only CloudFront can access the files, so people can't bypass the CDN.
resource "aws_cloudfront_origin_access_control" "frontend_oac" {
  name                              = "${var.project}-oac"
  description                       = "OAC for secure S3 access"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
# This is the CDN that serves my website globally.
# It makes the site load fast for everyone, no matter where they are.
resource "aws_cloudfront_distribution" "frontend_cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  # Aliases for Custom Domain
  aliases = [var.domain_name]

  # Logging (Optional, can add later)
  # logging_config {
  #   include_cookies = false
  #   bucket          = "logs-bucket.s3.amazonaws.com"
  #   prefix          = "cloudfront/"
  # }

  # -------------------------
  # Origins
  # -------------------------

  # 1. S3 Origin (Static Assets)
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.frontend.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
  }

  # 2. API Gateway Origin (Next.js SSR/API)
  origin {
    domain_name = replace(aws_apigatewayv2_api.http.api_endpoint, "/^https?:///", "")
    origin_id   = "APIGW-${aws_apigatewayv2_api.http.id}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # -------------------------
  # Cache Behaviors
  # -------------------------

  # Default Behavior -> Lambda (SSR)
  default_cache_behavior {
    target_origin_id       = "APIGW-${aws_apigatewayv2_api.http.id}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # Forward everything to Lambda
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Host"]
      cookies { forward = "all" }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Static Assets -> S3 (_next/static/*)
  ordered_cache_behavior {
    path_pattern           = "_next/static/*"
    target_origin_id       = "S3-${aws_s3_bucket.frontend.id}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  # Public Assets -> S3 (static/*) - assuming you put public images in /static folder or similar
  # Next.js serves public/* at root. We might need a behavior for specific known static patterns
  # or just let Lambda handle root static files (it redirects to S3 signed URLs or streams them).
  # For now, let's stick to _next/static optimization.

  # -------------------------
  # Settings
  # -------------------------

  # SSL Certificate
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Geo Restriction (Security/Cost)
  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["IN", "US", "GB", "CA", "AU"] # Adjust as needed
    }
  }

  tags = {
    Project = var.project
  }
}

# Route53 Alias Record → survey.statwox.in
# This part is commented out for now, but it's for connecting my custom domain later.
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

# Outputting the CloudFront URL so I know where to visit my site
output "cloudfront_url" {
  value = aws_cloudfront_distribution.frontend_cdn.domain_name
}

