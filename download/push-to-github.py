#!/usr/bin/env python3
"""
Skrip push SPMF ke GitHub menggunakan dulwich (pure-Python git).
Tidak memerlukan SSH client - hanya HTTPS + Personal Access Token (PAT).

Cara guna:
1. Jana Personal Access Token di GitHub:
   - Pergi ke https://github.com/settings/tokens
   - Klik "Generate new token (classic)"
   - Tandai scope "repo" (penuh)
   - Salin token (format: ghp_xxxxxxxxxxxx)

2. Jalankan skrip ini:
   python3 push-to-github.py
   (atau) python3 push-to-github.py --token ghp_xxxxxxxxxxxx

3. Token TIDAK akan disimpan - hanya digunakan sekali untuk push.
"""

import os
import sys
import argparse
import getpass

def push_to_github(token: str, repo_url: str = "https://github.com/hasbulatif/SPMF-V1.git"):
    from dulwich import porcelain
    from dulwich.repo import Repo

    repo_path = os.path.dirname(os.path.abspath(__file__))
    # Navigate to project root (parent of download/ folder)
    repo_path = os.path.dirname(repo_path)
    repo = Repo(repo_path)

    # Embed token in URL for authentication
    # Format: https://<token>@github.com/user/repo.git
    auth_url = repo_url.replace("https://", f"https://x-access-token:{token}@")

    print(f"Repo path: {repo_path}")
    print(f"Remote: {repo_url}")
    print(f"Branch: main")
    print(f"Pushing...")

    try:
        result = porcelain.push(
            repo,
            auth_url,
            refspecs='refs/heads/main:refs/heads/main',
        )
        print("\n✓ Push berjaya!")
        if result:
            print(f"Result: {result}")
        print(f"\nRepo tersedia di: {repo_url}")
    except Exception as e:
        print(f"\n✗ Push gagal: {type(e).__name__}")
        print(f"Ralat: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Push SPMF ke GitHub")
    parser.add_argument("--token", help="GitHub Personal Access Token (ghp_xxx)")
    args = parser.parse_args()

    token = args.token
    if not token:
        print("=" * 60)
        print("  SPMF - Push ke GitHub")
        print("=" * 60)
        print()
        print("Anda memerlukan GitHub Personal Access Token (PAT).")
        print()
        print("Cara jana PAT:")
        print("  1. Pergi ke https://github.com/settings/tokens")
        print("  2. Klik 'Generate new token (classic)'")
        print("  3. Tandai scope 'repo' (penuh)")
        print("  4. Salin token (format: ghp_xxxxxxxxxxxx)")
        print()
        token = getpass.getpass("Paste token anda (tersembunyi): ")

    if not token:
        print("Token diperlukan.")
        sys.exit(1)

    push_to_github(token)

if __name__ == "__main__":
    main()
