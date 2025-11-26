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
  default_root_object = "index.html"

  # Telling CloudFront where to get the files (my S3 bucket)
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.frontend.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
  }

  # How CloudFront should handle requests
  default_cache_behavior {
    target_origin_id       = "S3-${aws_s3_bucket.frontend.id}"
    viewer_protocol_policy = "redirect-to-https" # Always force HTTPS for security
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    # I'm not forwarding query strings or cookies because this is a static site
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  # Handling 403 Forbidden errors (common with SPAs like React)
  # If S3 says "Forbidden", I serve index.html so React Router can handle it.
  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  # Handling 404 Not Found errors
  # Same deal: if the file isn't found, let React handle the routing.
  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  # Using the default CloudFront SSL certificate for now
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  # No geo-restrictions, anyone can visit
  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  #  aliases = ["survey.statwox.in"]

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

