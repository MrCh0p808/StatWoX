output "api_base_url" {
  value = aws_apigatewayv2_api.http.api_endpoint
}

output "submit_url" {
  value = "${aws_apigatewayv2_api.http.api_endpoint}/${aws_apigatewayv2_stage.prod.name}/submit"
}

output "site_bucket" {
  value = aws_s3_bucket.frontend.bucket
}

output "site_url" {
  description = "HTTPS CloudFront domain for the StatWoX frontend"
  value       = "https://${aws_cloudfront_distribution.frontend_cdn.domain_name}"
}
