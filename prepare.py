#!/usr/bin/env python3
"""Build the pinned, script-free coach artwork before the public app bundle."""
import hashlib
import os
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parent
CLI=os.environ.get('RIVE_CLI','rive')
EXPECTED='c05d1b66beccc9093839e44ab12d68b9748c128da8a6108a54972b36cd932458'
version=subprocess.run([CLI,'--version'],check=True,capture_output=True,text=True).stdout.strip()
if version!='rive 1.8.0':raise SystemExit('Falling Blocks artwork requires Rive CLI 1.8.0; found '+version)
subprocess.run([CLI,str(ROOT/'coach'),'--verify'],check=True)
subprocess.run([CLI,str(ROOT/'coach'),'--once'],check=True)
asset=ROOT/'coach/build/coach.riv'
if hashlib.sha256(asset.read_bytes()).hexdigest()!=EXPECTED:raise SystemExit('Coach build differs from the reviewed source artifact; inspect and update its pinned hash.')
print('Prepared verified Falling Blocks coach')
