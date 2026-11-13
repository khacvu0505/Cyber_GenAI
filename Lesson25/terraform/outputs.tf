output "application_url" { value = "http://${aws_lb.app.dns_name}" }
output "frontend_ecr_repository_url" { value = data.aws_ecr_repository.frontend.repository_url }
output "backend_ecr_repository_url" { value = data.aws_ecr_repository.backend.repository_url }
output "ecs_cluster_name" { value = aws_ecs_cluster.app.name }
output "frontend_ecs_service_name" { value = aws_ecs_service.frontend.name }
output "backend_ecs_service_name" { value = aws_ecs_service.backend.name }
output "github_actions_role_arn" {
  value = local.github_oidc_enabled ? aws_iam_role.github_deploy[0].arn : null
}
output "rds_endpoint" { value = aws_db_instance.app.address }
