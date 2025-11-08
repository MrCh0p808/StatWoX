output "api_base_url" {
  value = "${aws_apigatewayv2_api.http.api_endpoint}/${aws_apigatewayv2_stage.prod.name}"
}

output "submit_url" {
  value = "${aws_apigatewayv2_api.http.api_endpoint}/${aws_apigatewayv2_stage.prod.name}/submit"
}

output "site_bucket" {
  value = aws_s3_bucket.frontend.bucket
}

output "site_website" {
  value = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}
