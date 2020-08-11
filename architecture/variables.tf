variable "project_region" {
  default = "europe-north1"
}

variable "spark_cluster_region" {
  default = "europe-west1"
}

variable "master_instances" {
  default = "1"
}
variable "master_machine_type" {
  default = "n1-standard-1"
}
variable "master_disk_size_gb" {
  default = "15"
}

variable "worker_instances" {
  default = "2"
}
variable "worker_machine_type" {
  default = "n1-standard-1"
}
variable "worker_disk_size_gb" {
  default = "15"
}
variable "worker_min_cpu_platform" {
  default = "Intel Skylake"
}