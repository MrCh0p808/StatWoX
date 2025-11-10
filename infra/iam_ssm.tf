data "aws_iam_policy_document" "lambda_ssm_policy" {
  statement {
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParameterHistory"
    ]
    resources = [
      "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/statwox/google-service-creds"
    ]
  }

  # If the parameter uses a customer-managed KMS key for encryption, you need kms:Decrypt as well:
  # statement {
  #   effect = "Allow"
  #   actions = ["kms:Decrypt"]
  #   resources = ["arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:key/*"]
  # }
}

resource "aws_iam_role_policy" "lambda_ssm_access" {
  name = "${var.project}-lambda-ssm-policy"
  role = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_ssm_policy.json
}

# helper data source for account
data "aws_caller_identity" "current" {}
