# provider "aws" {
#   alias  = "use1"
#   region = "us-east-1"
# }

# data "aws_route53_zone" "primary" {
#   name         = "statwox.in"
#   private_zone = false
# }

# resource "aws_acm_certificate" "frontend_cert" {
#   provider          = aws.use1
#   domain_name       = "survey.statwox.in"
#   validation_method = "DNS"
# }

# resource "aws_route53_record" "cert_validation" {
#   for_each = {
#     for dvo in aws_acm_certificate.frontend_cert.domain_validation_options :
#     dvo.domain_name => {
#       name   = dvo.resource_record_name
#       type   = dvo.resource_record_type
#       record = dvo.resource_record_value
#     }
#   }

#   zone_id = data.aws_route53_zone.primary.zone_id
#   name    = each.value.name
#   type    = each.value.type
#   records = [each.value.record]
#   ttl     = 60
# }

# resource "aws_acm_certificate_validation" "frontend_cert_validation" {
#   provider                = aws.use1
#   certificate_arn         = aws_acm_certificate.frontend_cert.arn
#   validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
# }
