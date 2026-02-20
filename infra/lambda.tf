data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../dist/lambda"
  output_path = "${path.module}/lambda.zip"
  excludes    = []
}

resource "aws_iam_role" "lambda_exec" {
  name = "${var.project}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "submit" {
  function_name    = "${var.project}-submit"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = "nodejs20.x"
  architectures    = ["arm64"]
  handler          = "run.sh" # Using AWS Lambda Adapter
  filename         = "${path.module}/lambda.zip"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      DATABASE_URL     = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.default.endpoint}/${aws_db_instance.default.db_name}"
      JWT_SECRET       = var.jwt_secret
      GOOGLE_CLIENT_ID = var.google_client_id
      ALLOWED_ORIGIN   = "*"
      # Adapter Configuration
      AWS_LAMBDA_EXEC_WRAPPER = "/opt/bootstrap"
      PORT                    = "3000"
    }
  }

  # Layer for AWS Lambda Adapter (ARM64)
  layers = [
    "arn:aws:lambda:${var.aws_region}:753240598075:layer:LambdaAdapterLayerArm64:24" # Verify latest version
  ]

  timeout     = 30
  memory_size = 1024 # Recommended for Next.js SSR
  depends_on  = [aws_iam_role_policy_attachment.lambda_logs]
}
