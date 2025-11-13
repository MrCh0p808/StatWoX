# PHASE2: CloudWatch alarm skeleton
# Billing alarm and Lambda error alarm examples. Review and adjust ARNs before apply.

# Billing alarm (watch your free-tier threshold via AWS console; resource defined for plan visibility)
resource "aws_cloudwatch_metric_alarm" "billing_threshold_small" {
  alarm_name          = "${var.project}-billing-threshold-small"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = 21600
  statistic           = "Maximum"
  threshold           = 5.0
  alarm_description   = "Notify if estimated charges exceed $5 (plan-only resource)."
  alarm_actions       = []
  ok_actions          = []
  dimensions = {
    Currency = "USD"
  }
  lifecycle {
    prevent_destroy = false
  }
}

# Example Lambda error alarm (adjust function name if different)
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project}-lambda-errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  dimensions = {
    FunctionName = "${var.project}-submit"
  }
  alarm_description = "Alert if Lambda submit produces >=1 error in 5m"
  alarm_actions     = []
}
