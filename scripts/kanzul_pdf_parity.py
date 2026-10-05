#!/usr/bin/env python3
"""Generate lib/raml/engine/__tests__/kanzulPdfParity.fixture.json from the
authoritative Kanzul Mikban PDF (docs/Kanzul-Mikban-Final-Edition.pdf).

The PDF draws every geomantic figure as an embedded image, so plain text
extraction drops them. This script reads the actual page structure:
  * the PDF holds 16 unique figure images; each is decoded to its four-row dot
    pattern by counting dots per row (top row first, the order of `Pattern` in
    content/stars.ts), calibrated on the edition's own page-3 example
    ("even, odd, odd, even" = 2112), then matched to a canonical STARS id by
    exact pattern equality;
  * each figure placement is put back into the text in reading order;
  * headings are the bold 24pt/20pt lines.
Requires: pip install pymupdf. Usage: python3 scripts/kanzul_pdf_parity.py
The fixture is what kanzul-pdf-parity.test.ts compares the app against.
"""
import hashlib, json, re, sys
import pymupdf

ROOT = __file__.rsplit("/scripts/", 1)[0]
PDF = ROOT + "/docs/Kanzul-Mikban-Final-Edition.pdf"
OUT = ROOT + "/lib/raml/engine/__tests__/kanzulPdfParity.fixture.json"

stars = open(ROOT + "/content/stars.ts").read()
ROWS = re.findall(r"id: '([a-z-]+)',\s*number: \d+,\s*name: '([^']+)',\s*pattern: \[(\d), (\d), (\d), (\d)\]", stars)
NAME = {i: n for i, n, *_ in ROWS}
BYPAT = {a + b + c + d: i for i, n, a, b, c, d in ROWS}
NAMETOK = {i: [re.sub(r"[^a-z0-9&]+", "", w.lower()) for w in n.split()] for i, n in NAME.items()}
ORDER = sorted(NAMETOK, key=lambda i: -len(NAMETOK[i]))

doc = pymupdf.open(PDF)


def wn(s):
    s = s.lower().replace("’", "'").replace("‘", "'")
    return re.sub(r"[^a-z0-9&]+", "", s)


def decode(xref):
    sm = doc.extract_image(xref)["smask"]
    pm = pymupdf.Pixmap(doc, sm)
    w, h, n = pm.width, pm.height, pm.n
    s = pm.samples
    on = [[s[(y * w + x) * n] > 128 for x in range(w)] for y in range(h)]
    seen, blobs = set(), []
    for y in range(h):
        for x in range(w):
            if on[y][x] and (y, x) not in seen:
                st, px = [(y, x)], []
                seen.add((y, x))
                while st:
                    cy, cx = st.pop()
                    px.append((cy, cx))
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and on[ny][nx] and (ny, nx) not in seen:
                            seen.add((ny, nx))
                            st.append((ny, nx))
                if len(px) >= 8:
                    blobs.append((sum(a for a, _ in px) / len(px), sum(b for _, b in px) / len(px)))
    blobs.sort()
    rows = []
    for b in blobs:
        if rows and abs(b[0] - rows[-1][0][0]) < 8:
            rows[-1].append(b)
        else:
            rows.append([b])
    return "".join(str(len(r)) for r in rows)


xrefs = {im["xref"] for p in doc for im in p.get_image_info(xrefs=True)}
XPAT = {x: decode(x) for x in sorted(xrefs)}
assert len(set(XPAT.values())) == 16 and XPAT[21] == "2112", "figure decode failed calibration"


def page_lines(pn):
    p = doc[pn]
    lines = {}
    for w in p.get_text("words"):
        lines.setdefault(round(w[3] / 2), []).append((w[0], w[4]))
    ordered = [[k, lines[k]] for k in sorted(lines)]
    for im in p.get_image_info(xrefs=True):
        bb = im["bbox"]
        tok = "<%s>" % XPAT[im["xref"]]
        best = None
        for ln in ordered:
            y = ln[0] * 2
            if bb[3] - 3 <= y <= bb[3] + 12:
                d = abs(y - (bb[3] + 4))
                if best is None or d < best[0]:
                    best = (d, ln)
        if best:
            best[1][1].append((bb[0], tok))
        else:
            ordered.append([round((bb[3] + 4) / 2), [(bb[0], tok)]])
    ordered.sort(key=lambda l: l[0])
    out = []
    for _, parts in ordered:
        parts.sort(key=lambda t: t[0])
        out.append(" ".join(t for _, t in parts))
    return out


# ---- headings (bold 24pt / 20pt), body pages 19+ ----
heads = []
for i in range(18, len(doc)):
    cur = None
    for b in doc[i].get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            sp = [s for s in l["spans"] if s["text"].strip()]
            if not sp:
                continue
            kind = "H" if all(s["font"].startswith("Carlito-Bold") and s["size"] >= 19 for s in sp) else None
            txt = "".join(s["text"] for s in sp).strip()
            if kind:
                if cur and abs(l["bbox"][1] - cur[2]) < 45:
                    cur[1] += " " + txt
                    cur[2] = l["bbox"][3]
                else:
                    if cur:
                        heads.append((cur[0], cur[1]))
                    cur = [i + 1, txt, l["bbox"][3]]
            elif cur:
                heads.append((cur[0], cur[1]))
                cur = None
    if cur:
        heads.append((cur[0], cur[1]))

ones = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
tens = {"twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90}


def w2n(w):
    n = 0
    for x in re.split(r"[- ]", w.lower()):
        if x == "and":
            continue
        if x in ones:
            n += ones.index(x)
        elif x in tens:
            n += tens[x]
        elif x == "hundred":
            n = (n or 1) * 100
        else:
            return None
    return n


# ---- body text with figure tokens ----
flat = ""
for pn in range(18, len(doc)):
    ls = [l for l in page_lines(pn) if l.strip() != "Kanzul Mikban" and not re.fullmatch(r"\d{1,3}", l.strip())]
    flat += " " + " ".join(ls)
flat = re.sub(r"\s+", " ", flat)
starts, cursor = [], 0
for pg, t in heads:
    key = re.sub(r"\s+", " ", t).strip()
    i = flat.find(key, cursor)
    if i < 0:
        key = key.replace("- ", "-")
        i = flat.find(key, cursor)
    assert i >= 0, ("heading not found", t)
    starts.append((i, i + len(key)))
    cursor = i + len(key)


def tokens(text):
    raw = re.findall(r"\S+", text)
    pw = []
    for r in raw:
        m = re.fullmatch(r"<(\d{4})>[,.;:)]*", r)
        pw.append((r, "FIG:" + BYPAT[m.group(1)]) if m else (r, wn(r)))
    out, i = [], 0
    prev_name = False
    norm = [w[1] for w in pw]
    while i < len(pw):
        n = norm[i]
        if n == "":
            i += 1
            continue
        if n.startswith("FIG:"):
            sid = n[4:]
            if out and out[-1] == "S:" + sid and prev_name:
                i += 1
                continue
            out.append("S:" + sid)
            prev_name = False
            i += 1
            continue
        hit = None
        for sid in ORDER:
            nt = NAMETOK[sid]
            if norm[i : i + len(nt)] == nt:
                hit = sid
                break
        if hit:
            out.append("S:" + hit)
            prev_name = True
            i += len(NAMETOK[hit])
            continue
        out.append(n)
        prev_name = False
        i += 1
    return out


entries = []
for n, (s, e) in enumerate(starts):
    end = starts[n + 1][0] if n + 1 < len(starts) else len(flat)
    text = flat[e:end].strip()
    pg, title = heads[n]
    m = re.match(r"Chapter ([A-Za-z\- ]+?) — (.*)$", title)
    num = w2n(m.group(1)) if m else None
    entries.append(
        dict(
            page=pg,
            number=num,
            title=(m.group(2) if m and num is not None else title),
            tokens=" ".join(tokens(text)),
            figures=[BYPAT[x] for x in re.findall(r"<(\d{4})>", text)],
        )
    )

# ---- front matter (pages 3-6) + invocation (page 19) ----
secs, cur = [], None
for pn in (2, 3, 4, 5):
    for b in doc[pn].get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            sp = [s for s in l["spans"] if s["text"].strip()]
            if not sp:
                continue
            f, sz, t = sp[0]["font"], sp[0]["size"], "".join(s["text"] for s in sp).strip()
            if (f == "Caladea-Italic" and t == "Kanzul Mikban") or re.fullmatch(r"\d{1,2}", t):
                continue
            if f.startswith("Carlito-Bold") and sz >= 19:
                cur = dict(title=t, level=1 if f == "Carlito-Bold" else 2, lines=[])
                secs.append(cur)
            elif cur is not None:
                cur["lines"].append(t)
for s in secs:
    out = ""
    for l in s.pop("lines"):
        out = out + l if out.endswith("-") else (out + " " if out else "") + l
    s["text"] = out
inv = []
for b in doc[18].get_text("dict")["blocks"]:
    stop = False
    for l in b.get("lines", []):
        sp = [s for s in l["spans"] if s["text"].strip()]
        if not sp:
            continue
        t = "".join(s["text"] for s in sp).strip()
        if sp[0]["font"].startswith("Carlito-Bold"):
            if t.startswith("Chapter One"):
                stop = True
                break
            continue
        if t == "Kanzul Mikban" or re.fullmatch(r"\d{1,3}", t):
            continue
        inv.append(t)
    if stop:
        break

sha = hashlib.sha256(open(PDF, "rb").read()).hexdigest()
json.dump(
    dict(source=dict(file="docs/Kanzul-Mikban-Final-Edition.pdf", sha256=sha, pages=len(doc), figureImages=len(XPAT)), frontMatter=secs, invocationLines=inv, entries=entries),
    open(OUT, "w"),
    ensure_ascii=False,
    indent=0,
)
print("entries", len(entries), "->", OUT)
