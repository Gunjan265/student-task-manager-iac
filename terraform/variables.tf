variable "account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "worker_name" {
  type    = string
  default = "student-task-manager"
}

variable "kv_namespace_name" {
  type    = string
  default = "student_tasks"
}

variable "environment" {
  type    = string
  default = "test"
}

