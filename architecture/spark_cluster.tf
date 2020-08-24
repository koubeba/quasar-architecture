provider "google-beta" {
  project = "quasar-286018"
  credentials = "./credentials/gcloud.json"
  region = var.project_region
}

resource "google_storage_bucket" "spark_cluster_staging_bucket" {
  project = var.project_id
  name = "quasar-spark-cluster-staging-bucket"
  location = var.project_region
  force_destroy = true
}

resource "google_compute_network" "spark_cluster_network" {
  project = var.project_id
  name = "spark-cluster-network"
  auto_create_subnetworks = true
}

resource "google_compute_firewall" "spark_cluster_internal_firewall" {
  project = var.project_id
  name = "spark-cluster-internal-firewall"
  priority = 900
  network = google_compute_network.spark_cluster_network.name
  depends_on = [google_compute_network.spark_cluster_network]

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports = ["0-65535"]
  }

  source_ranges = ["10.0.0.0/8"]
}

resource "google_compute_firewall" "spark_cluster_external_firewall" {
  project = var.project_id
  name = "spark-cluster-external-firewall"
  priority = 1000
  network = google_compute_network.spark_cluster_network.name
  depends_on = [google_compute_network.spark_cluster_network]

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports = ["22", "2181", "8088", "8123","9000", "9090", "9092", "14040", "18080"]
  }

  source_ranges = ["0.0.0.0/0"]
}

resource "google_dataproc_cluster" "spark_cluster" {
  project = var.project_id
  name    = "spark-cluster"
  region  = var.spark_cluster_region
  depends_on = [google_storage_bucket.spark_cluster_staging_bucket,
                google_compute_network.spark_cluster_network,
                google_compute_firewall.spark_cluster_internal_firewall,
                google_compute_firewall.spark_cluster_external_firewall]

  cluster_config {

    staging_bucket = google_storage_bucket.spark_cluster_staging_bucket.name

    gce_cluster_config {
      network = google_compute_network.spark_cluster_network.name
      metadata = {
        "run-on-master": "true",
        "kafka-enable-jmx": "true"
      }
    }

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

    software_config {
      image_version = "preview-ubuntu18"
      optional_components = ["ANACONDA", "JUPYTER", "ZOOKEEPER"]
    }

    initialization_action {
      script = "gs://dataproc-initialization-actions/kafka/kafka.sh"
    }

    initialization_action {
      script = "gs://dataproc-initialization-actions/kafka/cruise-control.sh"
    }
  }
}

