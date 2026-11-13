# AWS Architecture for project

### VPC

- One VPC Only
- 6 subnet
  - public a
  - public b
  - app-private-a
  - app-private-b
  - db-private-a
  - db-private-b
- One Internet gateway
  - Subnet Association: public-a, public-b
- One NAT Gateway: (in public-a)
  - Subnet Association: app-private-a, app-private-b

- Route Tables:
  - public-rtb: public-a, public-b
  - to: Internet gateway

  - private-rtb: private-a, private-b

- Security Groups:
  - ALB Security Group (In: Anywhere HTTP & HTTPS)
  - Frontend Security Group (In: ALB port 3000)
  - Backend Security Group (In: ALB port 8000, out: RDS 5432)
  - RDS Security Group (In: Backend port 5432, out: Anywhere)

### RDS

- Create an instance using postgresSQL

### ECR

- Create 2 repositories, one for frontend, one for backend, name of the repositories will be specified in the variables file

### ECS

- 2 task definitions, one for frontend, one for backend
- One Cluster only for whole project

### S3

- Create S3 bucket for prj
