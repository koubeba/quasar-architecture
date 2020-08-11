provider "google-beta" {
  project = "quasar-286018"
  credentials = "./credentials/gcloud.json"
  region = var.project_region
}

resource "google_dataproc_cluster" "spark_cluster" {
  project = "quasar-286018"
  name    = "spark-cluster"
  region  = var.spark_cluster_region

  cluster_config {
    master_config {
      num_instances = var.master_instances
      machine_type = var.master_machine_type
      disk_config {
        boot_disk_type = "pd-ssd"
        boot_disk_size_gb = var.master_disk_size_gb
      }
    }

    worker_config {
      num_instances = var.worker_instances
      machine_type = var.worker_machine_type
      min_cpu_platform = var.worker_min_cpu_platform
      disk_config {
        num_local_ssds = 1
        boot_disk_size_gb = var.worker_disk_size_gb
      }
    }
  }
}