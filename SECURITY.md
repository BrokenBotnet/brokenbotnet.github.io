# 🛡️ Security Policy

### ✨ Supported Versions

We strive to keep our website and deployment processes secure. Currently, the following versions are supported:

| Version     | Supported    |
| ----------- | -----------  |
| main branch | ✅          | 

## 🚨 Reporting Vulnerabilities

If you discover a security vulnerability, **do not open a public issue**. Instead, email us at [r3bo0tbx1@brokenbotnet.com](mailto:r3bo0tbx1@brokenbotnet.com), and for added security, **encrypt your report** using our PGP key:

- **PGP Key**: [Public Key Block](https://keys.openpgp.org/vks/v1/by-fingerprint/33727F5377D296C320AF704AB3BD6196E1CFBFB4)
- **Key Fingerprint**: `0xB3BD6196E1CFBFB4`

Please include:
- 📝 A detailed description of the issue.
- ⚙️ Steps to reproduce or proof of concept.
- 🔍 Potential impact and suggested fixes.

We will respond within 5 business days and aim to resolve verified issues within 10 business days.

## 🔒 Security Practices

- **Deployment**: GitHub Actions automates our deployment, with secrets securely stored via GitHub Secrets.
- **Dependencies**: Regular `npm audit` checks and [Dependabot](https://github.com/dependabot) help us address vulnerabilities in dependencies promptly.
- **Data Security**: This repository is a static website that doesn't handle user data or backend services. Content is delivered securely via HTTPS, and no sensitive information like passwords or API keys is stored here.
- **Content Integrity**: Branch protection, mandatory code reviews, and build validation ensure unauthorized changes are prevented.

Thank you for helping us keep our project secure! 🔐
