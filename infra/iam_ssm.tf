# Allows Lambda to securely fetch Google credentials stored in
# AWS SSM Parameter Store (SecureString type).
# If you ever encrypt with your own KMS key, enable kms:Decrypt below.

# (Optional) Add this block only if using a customer-managed KMS key
# statement {
#   effect = "Allow"
#   actions = ["kms:Decrypt"]
#   resources = [
#     "arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:key/*"
#   ]
# }

resource "aws_iam_role_policy" "lambda_ssm_access" {
  name = "${var.project}-lambda-ssm-policy"
  role = aws_iam_role.lambda_exec.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParameterHistory"
      ],
      Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/statwox/*"
    }]
  })
}

# helper data source for account
data "aws_caller_identity" "current" {}
