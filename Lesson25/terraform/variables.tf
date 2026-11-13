variable "aws_region" {
  description = "AWS region in which to create the application stack."
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Lowercase name used as a prefix for all resources."
  type        = string
  default     = "cv-ranking"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "project_name may contain only lowercase letters, numbers, and hyphens."
  }
}

variable "github_repository" {
  description = "GitHub repository allowed to deploy, in owner/repository format. Set to null to skip the GitHub OIDC role."
  type        = string
  default     = null
  nullable    = true
}

variable "frontend_ecr_repository_name" {
  description = "Name of the existing frontend ECR repository from which ECS pulls images."
  type        = string
  default     = "app-frontend"
}

variable "backend_ecr_repository_name" {
  description = "Name of the existing backend ECR repository from which ECS pulls images."
  type        = string
  default     = "app-backend"
}

variable "initial_frontend_image" {
  description = "A valid frontend image URI used when Terraform creates the first ECS task definition. Replace it through CI after bootstrap."
  type        = string
}

variable "initial_backend_image" {
  description = "A valid backend image URI used when Terraform creates the first ECS task definition. Replace it through CI after bootstrap."
  type        = string
}

variable "container_cpu" {
  description = "Fargate CPU units for each service."
  type        = number
  default     = 256
}

variable "container_memory" {
  description = "Fargate memory in MiB for each service."
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Number of backend tasks to run initially."
  type        = number
  default     = 1
}

variable "frontend_desired_count" {
  description = "Number of frontend tasks to run initially."
  type        = number
  default     = 1
}

variable "openai_api_key" {
  description = "Optional OpenAI API key. It is stored in AWS Secrets Manager, so do not commit it in a tfvars file."
  type        = string
  default     = null
  nullable    = true
  sensitive   = true
}

variable "openai_model" {
  description = "Model name supplied to the backend."
  type        = string
  default     = "gpt-5-mini"
}

variable "db_name" {
  description = "PostgreSQL database name."
  type        = string
  default     = "cv_ranking_platform"
}

variable "db_username" {
  description = "PostgreSQL master username. The password is generated and managed by RDS."
  type        = string
  default     = "cvadmin"
}

variable "tags" {
  description = "Additional AWS tags."
  type        = map(string)
  default     = {}
}
