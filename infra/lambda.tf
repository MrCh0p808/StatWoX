data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/dist"
  output_path = "${path.module}/lambda.zip"
  excludes    = fileexists("${path.module}/../backend/.lambdaignore") ? split("\n", file("${path.module}/../backend/.lambdaignore")) : []
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
  handler          = "lambda.handler"
  filename = "${path.module}/lambda.zip"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      DATABASE_URL = var.DATABASE_URL
      JWT_SECRET   = var.JWT_SECRET
    }
  }
  timeout    = 10
  depends_on = [aws_iam_role_policy_attachment.lambda_logs]
}
