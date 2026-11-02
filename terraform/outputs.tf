output "worker_name" {
  value = cloudflare_worker.app.name
}

output "kv_namespace_id" {
  value = cloudflare_workers_kv_namespace.tasks.id
}

output "environment" {
  value = var.environment
}
