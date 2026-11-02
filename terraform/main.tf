resource "cloudflare_workers_kv_namespace" "tasks" {
  account_id = var.account_id
  title      = var.kv_namespace_name
}

resource "cloudflare_worker" "app" {
  account_id = var.account_id
  name       = var.worker_name
}

resource "cloudflare_worker_version" "app" {
  account_id         = var.account_id
  worker_id          = cloudflare_worker.app.id
  compatibility_date = "2026-10-01"
  main_module        = "worker.js"

  modules = [{
    name         = "worker.js"
    content_type = "application/javascript+module"
    content_file = "${path.module}/../application/worker.js"
  }]

  bindings = [
    {
      type         = "kv_namespace"
      name         = "TASKS_KV"
      namespace_id = cloudflare_workers_kv_namespace.tasks.id
    },
    {
      type = "plain_text"
      name = "ENVIRONMENT"
      text = var.environment
    }
  ]
}

resource "cloudflare_workers_deployment" "app" {
  account_id  = var.account_id
  script_name = cloudflare_worker.app.name
  strategy    = "percentage"
  versions = [{
    percentage = 100
    version_id = cloudflare_worker_version.app.id
  }]
}

resource "cloudflare_workers_script_subdomain" "app" {
  account_id  = var.account_id
  script_name = cloudflare_worker.app.name
  enabled     = true
}
