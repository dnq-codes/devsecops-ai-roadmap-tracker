export interface StudyResource {
  label: string;
  url: string;
}

export interface DayTask {
  day: number;
  title: string;
  duration: string;
  tags: string[];
  resources: StudyResource[];
}

export interface Phase {
  id: number;
  name: string;
  startDay: number;
  endDay: number;
  certTarget: {
    name: string;
    url: string;
    unlockCondition: string;
  };
}

export const PHASES: Phase[] = [
  {
    id: 1,
    name: "Phase 1: Foundation",
    startDay: 1,
    endDay: 21,
    certTarget: {
      name: "GitHub Foundations Certificate (free)",
      url: "https://examregistration.github.com/",
      unlockCondition: "Complete all Phase 1 tasks (Days 1 - 21)"
    }
  },
  {
    id: 2,
    name: "Phase 2: DevOps Core",
    startDay: 22,
    endDay: 42,
    certTarget: {
      name: "AWS Cloud Practitioner Essentials (free course)",
      url: "https://skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials",
      unlockCondition: "Complete all Phase 2 tasks (Days 22 - 42)"
    }
  },
  {
    id: 3,
    name: "Phase 3: DevSecOps",
    startDay: 43,
    endDay: 63,
    certTarget: {
      name: "Fortinet NSE 1-3 (free) + Cisco CyberOps (free)",
      url: "https://training.fortinet.com/local/staticpage/view.php?page=nse_1",
      unlockCondition: "Complete all Phase 3 tasks (Days 43 - 63)"
    }
  },
  {
    id: 4,
    name: "Phase 4: K8s + IaC + Monitoring",
    startDay: 64,
    endDay: 85,
    certTarget: {
      name: "LFS158x: Intro to Kubernetes - Linux Foundation (free)",
      url: "https://training.linuxfoundation.org/training/introduction-to-kubernetes/",
      unlockCondition: "Complete all Phase 4 tasks (Days 64 - 85)"
    }
  },
  {
    id: 5,
    name: "Phase 5: Advanced + Freelance",
    startDay: 86,
    endDay: 95,
    certTarget: {
      name: "Google Cybersecurity Certificate (Coursera audit free)",
      url: "https://www.coursera.org/professional-certificates/google-cybersecurity",
      unlockCondition: "Complete all Phase 5 tasks (Days 86 - 95)"
    }
  }
];

export const ROADMAP_DAYS: DayTask[] = [
  // Phase 1 — Foundation
  { day: 1, title: "Linux intro: what is Linux, distros, terminal basics", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "freeCodeCamp Linux full course", url: "https://youtu.be/ROjZy1WbCIA" },
    { label: "Linux Journey (interactive)", url: "https://linuxjourney.com" }
  ]},
  { day: 2, title: "File system: ls, cd, pwd, mkdir, rm, cp, mv", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "Linux Journey — Grasshopper", url: "https://linuxjourney.com/lesson/the-shell" }
  ]},
  { day: 3, title: "Permissions: chmod, chown, groups, sudo", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "Linux permissions explained", url: "https://youtu.be/LnKoncbQBsM" },
    { label: "Kaggle Intro to Python", url: "https://www.kaggle.com/learn/python" }
  ]},
  { day: 4, title: "Processes: ps, top, htop, kill, jobs, bg, fg", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "Linux processes tutorial", url: "https://youtu.be/tk3UItrDS3s" }
  ]},
  { day: 5, title: "Networking basics: ping, curl, wget, netstat, ss", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "Linux networking commands", url: "https://youtu.be/6O-6uMFSCzo" },
    { label: "Kaggle Python — continue", url: "https://www.kaggle.com/learn/python" }
  ]},
  { day: 6, title: "Text tools: cat, grep, awk, sed, pipes, redirects", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "grep/awk/sed crash course", url: "https://youtu.be/OzBEV1ABdEE" }
  ]},
  { day: 7, title: "Bash scripting: variables, loops, if/else, functions", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "Bash scripting full course", url: "https://youtu.be/tK9Oc6AEnR4" },
    { label: "Kaggle Python — complete", url: "https://www.kaggle.com/learn/python" }
  ]},
  { day: 8, title: "Git basics: init, add, commit, log, status", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "Git & GitHub crash course", url: "https://youtu.be/RGOj5yH7evk" },
    { label: "GitHub Skills", url: "https://skills.github.com" }
  ]},
  { day: 9, title: "Branching: branch, checkout, merge, rebase", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "Git branching tutorial", url: "https://youtu.be/e2IbNHi4uCI" },
    { label: "Kaggle Pandas — start", url: "https://www.kaggle.com/learn/pandas" }
  ]},
  { day: 10, title: "Remote: clone, push, pull, fetch, pull requests", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "GitHub Skills — first day on GitHub", url: "https://skills.github.com" }
  ]},
  { day: 11, title: "Conflicts, .gitignore, tags, releases", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "GitHub docs — conflicts", url: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts" },
    { label: "Kaggle Pandas — continue", url: "https://www.kaggle.com/learn/pandas" }
  ]},
  { day: 12, title: "GitHub Actions intro: what is CI/CD, yaml basics", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "GitHub Actions tutorial", url: "https://youtu.be/R8_veQiYBjI" }
  ]},
  { day: 13, title: "Project: push a portfolio/README with proper commits", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "GitHub profile README guide", url: "https://youtu.be/ECuqb5Tv9qI" },
    { label: "Kaggle Pandas — complete", url: "https://www.kaggle.com/learn/pandas" }
  ]},
  { day: 14, title: "Review day: revise Linux + Git, fix gaps", duration: "2hr DevOps", tags: ["devops"], resources: [] },
  { day: 15, title: "Networking: OSI model, TCP/IP, DNS, HTTP/HTTPS, ports", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "Networking fundamentals", url: "https://youtu.be/qiQR5rTSshw" }
  ]},
  { day: 16, title: "SSH: key pairs, ssh-keygen, scp, secure remote login", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "SSH crash course", url: "https://youtu.be/v45p_kJV98A" },
    { label: "Kaggle Intro to ML — start", url: "https://www.kaggle.com/learn/intro-to-machine-learning" }
  ]},
  { day: 17, title: "Docker: what is containerization, images vs containers", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "Docker crash course", url: "https://youtu.be/pg19Z8LL06w" },
    { label: "Docker official docs", url: "https://docs.docker.com/get-started/" }
  ]},
  { day: 18, title: "Docker: run, pull, build, Dockerfile basics", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "Dockerfile tutorial", url: "https://youtu.be/LQjaJINkQXY" },
    { label: "Kaggle Intro to ML — continue", url: "https://www.kaggle.com/learn/intro-to-machine-learning" }
  ]},
  { day: 19, title: "Docker: volumes, networks, docker-compose basics", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "Docker compose tutorial", url: "https://youtu.be/SXwC9fSwct8" }
  ]},
  { day: 20, title: "Mini project: Dockerize a Python Flask / Node app", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "Dockerize Flask app", url: "https://youtu.be/0UG2x2iWerk" },
    { label: "Kaggle Intro to ML — complete", url: "https://www.kaggle.com/learn/intro-to-machine-learning" }
  ]},
  { day: 21, title: "Phase 1 review + apply for GitHub Foundations cert", duration: "2hr DevOps", tags: ["devops","cert"], resources: [
    { label: "GitHub Foundations cert", url: "https://examregistration.github.com/" },
    { label: "GitHub Skills practice", url: "https://skills.github.com" }
  ]},

  // Phase 2 — DevOps Core
  { day: 22, title: "CI/CD concept: build, test, deploy pipeline theory", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "CI/CD explained", url: "https://youtu.be/scEDHsr3APg" }
  ]},
  { day: 23, title: "GitHub Actions: workflow yaml, triggers, jobs, steps", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "GitHub Actions deep dive", url: "https://youtu.be/R8_veQiYBjI" },
    { label: "Google ML Crash Course", url: "https://developers.google.com/machine-learning/crash-course" }
  ]},
  { day: 24, title: "GitHub Actions: build a lint + test pipeline", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "GitHub Actions examples", url: "https://docs.github.com/en/actions/examples" }
  ]},
  { day: 25, title: "Secrets in Actions: env vars, GitHub secrets", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","security","aiml"], resources: [
    { label: "GitHub secrets tutorial", url: "https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions" }
  ]},
  { day: 26, title: "Auto-deploy pipeline: push → build → deploy", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "Deploy with GitHub Actions", url: "https://youtu.be/X3F3El_yvFg" }
  ]},
  { day: 27, title: "Project: full CI/CD pipeline for Dockerized app", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "Docker + GitHub Actions", url: "https://youtu.be/WW6ZFjotOrQ" }
  ]},
  { day: 28, title: "Review + push project to GitHub", duration: "2hr DevOps", tags: ["devops"], resources: [] },
  { day: 29, title: "AWS intro: regions, AZs, services overview, IAM basics", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "AWS Cloud Practitioner Essentials (FREE)", url: "https://skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials" }
  ]},
  { day: 30, title: "IAM: users, groups, roles, policies, least privilege", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","security","aiml"], resources: [
    { label: "AWS IAM tutorial", url: "https://youtu.be/iF9fs8Rw4Uo" },
    { label: "Kaggle Intermediate ML — start", url: "https://www.kaggle.com/learn/intermediate-machine-learning" }
  ]},
  { day: 31, title: "EC2: launch instance, SSH in, security groups, key pairs", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "AWS EC2 crash course", url: "https://youtu.be/iHX-jtKIVNA" }
  ]},
  { day: 32, title: "S3: buckets, objects, permissions, static hosting", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "AWS S3 tutorial", url: "https://youtu.be/e6w9LwZJFIA" },
    { label: "Kaggle Intermediate ML", url: "https://www.kaggle.com/learn/intermediate-machine-learning" }
  ]},
  { day: 33, title: "Nginx: install, reverse proxy, serve app behind Nginx", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "Nginx crash course", url: "https://youtu.be/7VAI73roXaY" }
  ]},
  { day: 34, title: "Deploy Docker app on EC2 + Nginx", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "Deploy Docker on EC2", url: "https://youtu.be/qNIniDftAcU" }
  ]},
  { day: 35, title: "VPC basics: subnets, security groups, routing", duration: "2hr DevOps", tags: ["devops","security"], resources: [
    { label: "AWS VPC explained", url: "https://youtu.be/fpxDGU2KdkA" }
  ]},
  { day: 36, title: "Route53 + HTTPS with Let's Encrypt", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "HTTPS on EC2", url: "https://youtu.be/NhNRqm6_sUs" }
  ]},
  { day: 37, title: "CloudWatch basics: logs, metrics, alarms", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "CloudWatch tutorial", url: "https://youtu.be/a4dhoTQCyRA" }
  ]},
  { day: 38, title: "Project: full stack app on EC2 + CI/CD + HTTPS", duration: "2hr DevOps", tags: ["devops"], resources: [] },
  { day: 39, title: "AWS Cloud Practitioner study (modules 1–4)", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","cert","aiml"], resources: [
    { label: "AWS CCP free course", url: "https://skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials" }
  ]},
  { day: 40, title: "AWS Cloud Practitioner study (modules 5–8)", duration: "2hr DevOps", tags: ["devops","cert"], resources: [
    { label: "AWS CCP free course", url: "https://skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials" }
  ]},
  { day: 41, title: "AWS CCP practice exam + schedule real exam", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","cert","aiml"], resources: [
    { label: "AWS CCP practice questions", url: "https://skillbuilder.aws/learn/course/external/view/elearning/9153/aws-certified-cloud-practitioner-official-practice-question-set-clf-c02-english" }
  ]},
  { day: 42, title: "Review week + update GitHub projects", duration: "2hr DevOps", tags: ["devops"], resources: [] },

  // Phase 3 — DevSecOps
  { day: 43, title: "Security mindset: CIA triad, threat models, OWASP Top 10", duration: "2hr Security", tags: ["security"], resources: [
    { label: "OWASP Top 10 explained", url: "https://youtu.be/ravRFf3bcXk" },
    { label: "Cisco CyberOps (free)", url: "https://www.netacad.com/courses/cybersecurity" }
  ]},
  { day: 44, title: "Linux hardening: firewall (ufw), fail2ban, SSH hardening", duration: "2hr Security + 30min AI/ML", tags: ["security","aiml"], resources: [
    { label: "Linux server hardening", url: "https://youtu.be/ZhMw53Ud2tY" }
  ]},
  { day: 45, title: "Secrets management: env vars, .env files, Vault intro", duration: "2hr Security", tags: ["security","devops"], resources: [
    { label: "HashiCorp Vault intro", url: "https://youtu.be/VYfl-DpZ5wM" },
    { label: "Fortinet NSE 1 (FREE cert)", url: "https://training.fortinet.com/local/staticpage/view.php?page=nse_1" }
  ]},
  { day: 46, title: "Cryptography basics: hashing, TLS/SSL, certs, PKI", duration: "2hr Security + 30min AI/ML", tags: ["security","aiml"], resources: [
    { label: "TLS/SSL explained", url: "https://youtu.be/T4Df5_cojAs" }
  ]},
  { day: 47, title: "Fortinet NSE 1 + NSE 2 training (self-paced FREE)", duration: "2hr Security", tags: ["security","cert"], resources: [
    { label: "Fortinet NSE 1", url: "https://training.fortinet.com/local/staticpage/view.php?page=nse_1" },
    { label: "Fortinet NSE 2", url: "https://training.fortinet.com/local/staticpage/view.php?page=nse_2" }
  ]},
  { day: 48, title: "Fortinet NSE 3 + complete NSE 1–3 certs", duration: "2hr Security + 30min AI/ML", tags: ["security","cert","aiml"], resources: [
    { label: "Fortinet NSE 3", url: "https://training.fortinet.com/local/staticpage/view.php?page=nse_3" }
  ]},
  { day: 49, title: "Review: security concepts + download NSE certs", duration: "2hr Security", tags: ["security"], resources: [] },
  { day: 50, title: "DevSecOps concept: shift-left security, SAST, DAST", duration: "2hr DevSecOps", tags: ["security","devops"], resources: [
    { label: "DevSecOps explained", url: "https://youtu.be/J73MELGF1Zs" }
  ]},
  { day: 51, title: "SAST: static analysis, add Semgrep to GitHub Actions", duration: "2hr DevSecOps + 30min AI/ML", tags: ["security","devops","aiml"], resources: [
    { label: "Semgrep setup", url: "https://semgrep.dev/docs/getting-started/" }
  ]},
  { day: 52, title: "Container scanning: Trivy — scan Docker images in pipeline", duration: "2hr DevSecOps", tags: ["security","devops"], resources: [
    { label: "Trivy tutorial", url: "https://youtu.be/gJB2UMsE1ik" },
    { label: "Trivy docs", url: "https://aquasecurity.github.io/trivy/" }
  ]},
  { day: 53, title: "Dependency scanning: Snyk free tier, OWASP Dependency Check", duration: "2hr DevSecOps + 30min AI/ML", tags: ["security","devops","aiml"], resources: [
    { label: "Snyk (free)", url: "https://snyk.io" }
  ]},
  { day: 54, title: "Secure Dockerfile: non-root user, minimal base image", duration: "2hr DevSecOps", tags: ["security","devops"], resources: [
    { label: "Dockerfile best practices", url: "https://docs.docker.com/develop/develop-images/dockerfile_best-practices/" }
  ]},
  { day: 55, title: "AWS security: MFA, IAM roles for EC2, Security Hub", duration: "2hr DevSecOps + 30min AI/ML", tags: ["security","devops","aiml"], resources: [
    { label: "AWS Security Hub", url: "https://youtu.be/Yo1pCWF89RQ" }
  ]},
  { day: 56, title: "Build a secure pipeline: Trivy + Semgrep + Snyk in one workflow", duration: "2hr DevSecOps", tags: ["security","devops"], resources: [] },
  { day: 57, title: "DAST: OWASP ZAP basics, scan a deployed app", duration: "2hr DevSecOps + 30min AI/ML", tags: ["security","devops","aiml"], resources: [
    { label: "OWASP ZAP tutorial", url: "https://youtu.be/dFBTLQR8rYw" }
  ]},
  { day: 58, title: "Web app attacks: SQLi, XSS, CSRF (theory + demo)", duration: "2hr Security", tags: ["security"], resources: [
    { label: "Web vulnerabilities crash course", url: "https://youtu.be/WjZBnHJOyZ0" },
    { label: "PortSwigger Web Academy (FREE)", url: "https://portswigger.net/web-security" }
  ]},
  { day: 59, title: "PortSwigger labs: SQLi + XSS (hands on)", duration: "2hr Security + 30min AI/ML", tags: ["security","aiml"], resources: [
    { label: "PortSwigger SQLi labs", url: "https://portswigger.net/web-security/sql-injection" }
  ]},
  { day: 60, title: "Cisco CyberOps modules 1–5", duration: "2hr Security", tags: ["security","cert"], resources: [
    { label: "Cisco CyberOps free course", url: "https://www.netacad.com/courses/cybersecurity" }
  ]},
  { day: 61, title: "Cisco CyberOps modules 6–12", duration: "2hr Security + 30min AI/ML", tags: ["security","cert","aiml"], resources: [
    { label: "Cisco CyberOps", url: "https://www.netacad.com/courses/cybersecurity" }
  ]},
  { day: 62, title: "Cisco CyberOps modules 13–end + complete cert", duration: "2hr Security", tags: ["security","cert"], resources: [
    { label: "Cisco CyberOps", url: "https://www.netacad.com/courses/cybersecurity" }
  ]},
  { day: 63, title: "DevSecOps capstone: add full security scanning to pipeline", duration: "2hr DevSecOps", tags: ["security","devops"], resources: [] },

  // Phase 4 — K8s + IaC + Monitoring
  { day: 64, title: "K8s concepts: pods, deployments, services, namespaces", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "Kubernetes crash course", url: "https://youtu.be/s_o8dwzRlu4" },
    { label: "LFS158x (FREE)", url: "https://training.linuxfoundation.org/training/introduction-to-kubernetes/" }
  ]},
  { day: 65, title: "kubectl: install, basic commands, minikube setup", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "Minikube setup", url: "https://minikube.sigs.k8s.io/docs/start/" }
  ]},
  { day: 66, title: "K8s: deploy a Docker app on minikube", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "Deploy to K8s tutorial", url: "https://youtu.be/X48VuDVv0do" }
  ]},
  { day: 67, title: "K8s: ConfigMaps, Secrets, environment config", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","security","aiml"], resources: [
    { label: "K8s Secrets guide", url: "https://kubernetes.io/docs/concepts/configuration/secret/" }
  ]},
  { day: 68, title: "K8s: Ingress, LoadBalancer, NodePort", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "K8s networking explained", url: "https://youtu.be/5lzUpDtmWgM" }
  ]},
  { day: 69, title: "K8s: Helm basics — package manager for K8s", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "Helm crash course", url: "https://youtu.be/5_J7RWLLVeQ" }
  ]},
  { day: 70, title: "K8s security: RBAC, network policies, pod security", duration: "2hr DevOps", tags: ["devops","security"], resources: [
    { label: "K8s security tutorial", url: "https://youtu.be/oBf5lrmquYI" }
  ]},
  { day: 71, title: "CI/CD to K8s: GitHub Actions → deploy to K8s", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "GitHub Actions to K8s", url: "https://youtu.be/R8_veQiYBjI" }
  ]},
  { day: 72, title: "EKS intro: managed K8s on AWS (theory + demo)", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "AWS EKS tutorial", url: "https://youtu.be/p6xDCz00TxU" }
  ]},
  { day: 73, title: "Project: K8s deployment with Helm + CI/CD", duration: "2hr DevOps", tags: ["devops"], resources: [] },
  { day: 74, title: "LFS158x study + complete Linux Foundation K8s cert", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","cert","aiml"], resources: [
    { label: "LFS158x Kubernetes FREE", url: "https://training.linuxfoundation.org/training/introduction-to-kubernetes/" }
  ]},
  { day: 75, title: "Terraform intro: IaC concept, providers, resources", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "Terraform crash course", url: "https://youtu.be/SLB_c_ayRMo" }
  ]},
  { day: 76, title: "Terraform: provision AWS EC2 + S3 with code", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "Terraform AWS tutorial", url: "https://developer.hashicorp.com/terraform/tutorials/aws-get-started" }
  ]},
  { day: 77, title: "Prometheus: metrics, setup, scraping, labels", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "Prometheus crash course", url: "https://youtu.be/h4Sl21AKiDg" }
  ]},
  { day: 78, title: "Grafana: dashboards, connect to Prometheus, alerts", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [
    { label: "Grafana tutorial", url: "https://youtu.be/lILY8eSspEo" }
  ]},
  { day: 79, title: "ELK stack intro: Elasticsearch, Logstash, Kibana", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "ELK stack tutorial", url: "https://youtu.be/MRMgd6E9AXE" }
  ]},
  { day: 80, title: "Project: full monitoring stack — Prometheus + Grafana on K8s", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [] },
  { day: 81, title: "Capstone build day 1: app + Docker + CI/CD", duration: "2hr DevOps", tags: ["devops"], resources: [] },
  { day: 82, title: "Capstone build day 2: security scanning layer", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","security","aiml"], resources: [] },
  { day: 83, title: "Capstone build day 3: K8s deployment + Helm", duration: "2hr DevOps", tags: ["devops"], resources: [] },
  { day: 84, title: "Capstone build day 4: monitoring + alerting", duration: "2hr DevOps + 30min AI/ML", tags: ["devops","aiml"], resources: [] },
  { day: 85, title: "Capstone build day 5: README, docs, GitHub polish", duration: "2hr DevOps", tags: ["devops"], resources: [] },

  // Phase 5 — Advanced + Freelance
  { day: 86, title: "Penetration testing basics: Kali Linux, Nmap, Metasploit", duration: "2hr Cyber", tags: ["security"], resources: [
    { label: "TCM Security free courses", url: "https://academy.tcm-sec.com/" },
    { label: "TryHackMe (free rooms)", url: "https://tryhackme.com" }
  ]},
  { day: 87, title: "TryHackMe: complete 3 beginner rooms", duration: "2hr Cyber", tags: ["security"], resources: [
    { label: "TryHackMe beginner path", url: "https://tryhackme.com/path/outline/beginner" }
  ]},
  { day: 88, title: "Cloud security: GuardDuty, WAF, AWS Shield", duration: "2hr Security", tags: ["security","devops"], resources: [
    { label: "AWS security services", url: "https://youtu.be/IqKpGnQ5rK4" }
  ]},
  { day: 89, title: "AI for DevSecOps: anomaly detection in logs, AI API usage", duration: "2hr DevOps + AI/ML", tags: ["devops","aiml","security"], resources: [
    { label: "OpenAI API docs", url: "https://platform.openai.com/docs" }
  ]},
  { day: 90, title: "MLOps: deploy ML models with Docker + CI/CD", duration: "2hr DevOps + AI/ML", tags: ["devops","aiml"], resources: [
    { label: "MLOps crash course", url: "https://youtu.be/9BgIDqAzfuA" }
  ]},
  { day: 91, title: "Google Cybersecurity Certificate (Coursera audit)", duration: "2hr Cyber", tags: ["security","cert"], resources: [
    { label: "Google Cybersecurity Certificate", url: "https://www.coursera.org/professional-certificates/google-cybersecurity" }
  ]},
  { day: 92, title: "Freelance setup: Upwork/Fiverr DevOps profile", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "DevOps freelancing guide", url: "https://youtu.be/3apRFrPBFwk" }
  ]},
  { day: 93, title: "Portfolio polish: README, project docs, LinkedIn", duration: "2hr DevOps", tags: ["devops"], resources: [] },
  { day: 94, title: "Mock interview prep: DevOps questions + answers", duration: "2hr DevOps", tags: ["devops"], resources: [
    { label: "DevOps interview questions", url: "https://youtu.be/lB9KGWZ8LRw" }
  ]},
  { day: 95, title: "Final review + job/freelance application strategy", duration: "2hr DevOps", tags: ["devops"], resources: [] }
];

export const getRoadmapDays = () => ROADMAP_DAYS;
