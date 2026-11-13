sudo dnf update -y

<!-- Install git --> sudo dnf install -y git

<!-- Install python  --> sudo dnf install -y python3.11 python3.11-pip python3.11-devel

<!-- Create folder --> sudo mkdir /opt/project

<!-- Check folder --> pwd

<!-- cd vào folder --> cd + [path]

<!-- Clone source --> sudo git clone https://github.com/Mlops-Cybersoft/training-lead-scoring-api.git backend

<!-- Upgrade python(if needed)  --> sudo python3.11 -m pip install --upgrade pip

<!-- Install env --> cd vir env ->  sudo python3.11 -m pip install -r requirements.txt

<!-- AWS Config --> sudo aws configure

sudo aws sts get-caller-identity

sudo aws s3 sync s3://cyber-genai-bucket/data/ /opt/project/training-course-data

sudo python3.11 scripts/prepare_data.py --raw-dir /opt/project/training-course-data

sudo python3.11 scripts/train_model.py

sudo python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
