#!/usr/bin/env python3
"""Stamp a fresh ?v= on every JS import and on index.html's JS/CSS links, so browsers always fetch the latest files.
Run before each commit:  python3 tools/stamp.py"""
import re, glob, time, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
v = time.strftime('%y%m%d%H%M%S')
for f in glob.glob(os.path.join(root, 'js', '*.js')):
    s = open(f, encoding='utf8').read()
    s = re.sub(r"(from '\./[a-z0-9-]+\.js)(\?v=\w+)?'", rf"\1?v={v}'", s)
    open(f, 'w', encoding='utf8').write(s)
p = os.path.join(root, 'index.html'); s = open(p, encoding='utf8').read()
s = re.sub(r'(js/app\.js|css/style\.css)(\?v=\w+)?"', rf'\1?v={v}"', s)
open(p, 'w', encoding='utf8').write(s); print('stamped', v)
