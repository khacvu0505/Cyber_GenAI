# Terraform infrastructure for CV Ranking

This folder defines an AWS environment for the CV Ranking frontend (Next.js) and backend (FastAPI). It replaces manual AWS Console setup with versioned infrastructure code.

It creates a VPC, two public and two private subnets, NAT gateway, ECS/Fargate services, an Application Load Balancer, CloudWatch logs, RDS PostgreSQL, Secrets Manager, and an optional GitHub Actions OIDC deployment role. It uses the existing `app-frontend` and `app-backend` ECR repositories; it never creates or deletes them.

## Important safety notes

- This is a **new stack**. It does not manage the existing ECR repositories, but do not run `apply` against other manually-created ECS/ALB resources without a migration plan.
- `terraform destroy` deletes the RDS instance because this learning stack uses `skip_final_snapshot = true`. Use a separate production backup strategy before changing that setting.
- A NAT gateway, ALB, ECS, RDS and Secrets Manager all incur AWS charges. Destroy the learning environment when finished.
- Never commit `terraform.tfvars`, state files, or an OpenAI API key.

## Prerequisites

Install Terraform (1.6+) and Docker, configure an AWS CLI profile with permissions to create the listed resources, and authenticate Docker to ECR when instructed below. The Terraform AWS provider reads the normal AWS CLI credential chain.

## Deploy from scratch

Run commands from this directory:

```bash
cd "/Users/vietannguyen/FPT Fresher Training/CICD/cv_ranking_cicd/terraform"
cp terraform.tfvars.example terraform.tfvars
terraform init
```

Edit only the non-secret values in `terraform.tfvars`. `frontend_ecr_repository_name` and `backend_ecr_repository_name` identify the existing repositories Terraform will use. They default to `app-frontend` and `app-backend`.

```bash
terraform output -raw frontend_ecr_repository_url
terraform output -raw backend_ecr_repository_url
```

Authenticate and push one bootstrap image for each application. Substitute the output values in the two `ECR_*` variables:

```bash
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com

ECR_FRONTEND="ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/app-frontend"
ECR_BACKEND="ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/app-backend"

docker build -t "$ECR_FRONTEND:bootstrap" ../cv_ranking
docker push "$ECR_FRONTEND:bootstrap"
docker build -t "$ECR_BACKEND:bootstrap" ../cv_ranking_be
docker push "$ECR_BACKEND:bootstrap"
```

Set `initial_frontend_image` and `initial_backend_image` in `terraform.tfvars` to the two image URIs ending in `:bootstrap`. Keep the OpenAI key out of the file and provide it only for the command that needs it:

```bash
export TF_VAR_openai_api_key='your-key' # optional; omit if ranking without OpenAI
terraform plan
terraform apply
```

Confirm the deployment:

```bash
terraform output application_url
curl "$(terraform output -raw application_url)/api/health"
```

The ALB sends normal routes to the frontend and `/api/*` to the FastAPI backend.

## Connect GitHub Actions

After `apply`, retrieve the role and infrastructure names:

```bash
terraform output -raw github_actions_role_arn
terraform output -raw ecs_cluster_name
terraform output -raw frontend_ecs_service_name
terraform output -raw backend_ecs_service_name
```

Set `AWS_ROLE_ARN` as a GitHub Actions repository variable. Then update the existing workflow variables in `cv_ranking/.github/workflows/deploy-ecs.yml` and `cv_ranking_be/.github/workflows/deploy-ecs.yml` to use the ECR repository, cluster, service, and container names emitted by Terraform. The workflows continue to build images and update ECS; Terraform owns the AWS infrastructure around them.

For a real production domain, add an ACM certificate and HTTPS listener before exposing the application publicly. The learning stack deliberately uses HTTP and the generated ALB DNS name to keep the initial setup focused.

## Existing ECR state cleanup

If an earlier version of this configuration created `cv-ranking-frontend` or `cv-ranking-backend`, remove only those two entries from Terraform state before planning. This does not delete the ECR repositories from AWS:

```bash
terraform state rm aws_ecr_repository.frontend
terraform state rm aws_ecr_repository.backend
```
