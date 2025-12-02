resource "aws_rds_cluster" "default" {
  cluster_identifier  = "${var.project}-aurora-cluster"
  engine              = "aurora-postgresql"
  engine_mode         = "provisioned"
  engine_version      = "16.1"
  database_name       = "statwox"
  master_username     = var.db_username
  master_password     = var.db_password
  skip_final_snapshot = true
  apply_immediately   = true

  # Serverless v2 Scaling Configuration
  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 1.0
  }
}

resource "aws_rds_cluster_instance" "default" {
  cluster_identifier  = aws_rds_cluster.default.id
  identifier          = "${var.project}-aurora-instance"
  engine              = aws_rds_cluster.default.engine
  engine_version      = aws_rds_cluster.default.engine_version
  instance_class      = "db.serverless"
  publicly_accessible = true # WARNING: For dev simplicity only. Avoid in strict prod.
}

output "db_endpoint" {
  value = aws_rds_cluster.default.endpoint
}
