resource "aws_db_instance" "default" {
  identifier           = "${var.project}-db"
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "16.1"
  instance_class       = "db.t3.micro"
  db_name              = "statwox"
  username             = var.db_username
  password             = var.db_password
  parameter_group_name = "default.postgres16"
  skip_final_snapshot  = true
  publicly_accessible  = true # Required for Zero Cost (No NAT) Lambda access

  # Networking
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  tags = {
    Name = "${var.project}-db"
  }
}

output "db_endpoint" {
  value = aws_db_instance.default.endpoint
}
