#!/usr/bin/env python3
"""Local preview: a tiny emulation of the Jekyll features this site uses (front matter, layouts,
{{ page.x }}, {{ content }}, {% if page.x %}, jsonify/prepend filters, Markdown pages).
Output goes to _site/. GitHub Pages runs real Jekyll; this is only for local checking.
Usage:  python3 _build/preview.py && python3 -m http.server -d _site 8080"""
import json, os, re, shutil, sys
import markdown

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "_site")
SKIP = {"_build", "_site", "_layouts", ".git", "README.md", "PROMPTS.md", "RESEARCH.md", ".gitignore"}


def split_fm(text):
    if not text.startswith("---"):
        return None, text
    _, head, body = text.split("---", 2)
    meta = {}
    for line in head.strip().splitlines():
        if not line.strip():
            continue
        k, v = line.split(":", 1)
        v = v.strip()
        meta[k.strip()] = json.loads(v) if v.startswith('"') else v
    return meta, body.lstrip("\n")


def apply_filters(val, chain):
    for f in chain:
        f = f.strip()
        if f == "jsonify":
            val = json.dumps(val)
        elif f.startswith("prepend:"):
            val = json.loads(f.split(":", 1)[1].strip()) + str(val)
        else:
            raise ValueError("Unsupported filter " + f)
    return val


def liquid(tpl, page, content):
    def cond(m):
        return m.group(2) if page.get(m.group(1)) else ""
    tpl = re.sub(r"\{%\s*if page\.(\w+)\s*%\}(.*?)\{%\s*endif\s*%\}", cond, tpl, flags=re.S)

    def var(m):
        parts = m.group(1).split("|")
        name = parts[0].strip()
        val = content if name == "content" else page.get(name.replace("page.", ""), "")
        return str(apply_filters(val, parts[1:]))
    out = re.sub(r"\{\{\s*(.*?)\s*\}\}", var, tpl)
    if "{%" in out:
        raise ValueError("Unhandled Liquid tag")
    return out


def render(path):
    text = open(path, encoding="utf-8").read()
    meta, body = split_fm(text)
    if meta is None:
        return None
    for bad in ("{{", "{%"):
        if bad in body:
            raise SystemExit("Liquid syntax in page body: " + path)
    if path.endswith(".md"):
        body = markdown.markdown(body, extensions=["tables", "toc", "sane_lists"])
    content, layout = body, meta.get("layout")
    while layout:
        lt = open(os.path.join(ROOT, "_layouts", layout + ".html"), encoding="utf-8").read()
        lmeta, lbody = split_fm(lt)
        content = liquid(lbody, meta, content)
        layout = (lmeta or {}).get("layout")
    return content


def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    n = 0
    for dirpath, dirs, files in os.walk(ROOT):
        rel = os.path.relpath(dirpath, ROOT)
        dirs[:] = [d for d in dirs if d not in SKIP and not d.startswith("_") and not d.startswith(".")]
        for fn in files:
            if fn in SKIP or (rel == "." and fn.startswith("_")):
                continue
            src = os.path.join(dirpath, fn)
            dst = os.path.join(OUT, rel, fn)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if fn.endswith((".html", ".md")):
                html = render(src)
                if html is not None:
                    if fn.endswith(".md"):
                        dst = dst[:-3] + ".html"
                    open(dst, "w", encoding="utf-8").write(html)
                    n += 1
                    continue
            shutil.copy2(src, dst)
    print("Rendered", n, "pages to _site/")


if __name__ == "__main__":
    main()
