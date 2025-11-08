resource "random_id" "rand" {
  byte_length = 3
}

locals {
  bucket_name = "${var.project}-survey-${random_id.rand.hex}"
}
