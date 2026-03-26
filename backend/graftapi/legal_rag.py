from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List

from django.conf import settings
from pypdf import PdfReader


STATE_CODES = {
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
}

STATE_NAME_TO_CODE = {
    "alabama": "AL",
    "alaska": "AK",
    "arizona": "AZ",
    "arkansas": "AR",
    "california": "CA",
    "colorado": "CO",
    "connecticut": "CT",
    "delaware": "DE",
    "florida": "FL",
    "georgia": "GA",
    "hawaii": "HI",
    "idaho": "ID",
    "illinois": "IL",
    "indiana": "IN",
    "iowa": "IA",
    "kansas": "KS",
    "kentucky": "KY",
    "louisiana": "LA",
    "maine": "ME",
    "maryland": "MD",
    "massachusetts": "MA",
    "michigan": "MI",
    "minnesota": "MN",
    "minesota": "MN",  # tolerate misspelling in filename
    "mississippi": "MS",
    "missouri": "MO",
    "montana": "MT",
    "nebraska": "NE",
    "nevada": "NV",
    "new_hampshire": "NH",
    "newhampshire": "NH",
    "new_jersey": "NJ",
    "newjersey": "NJ",
    "new_mexico": "NM",
    "newmexico": "NM",
    "new_york": "NY",
    "newyork": "NY",
    "north_carolina": "NC",
    "northcarolina": "NC",
    "north_dakota": "ND",
    "northdakota": "ND",
    "ohio": "OH",
    "oklahoma": "OK",
    "oregon": "OR",
    "pennsylvania": "PA",
    "pennslyvania": "PA",  # tolerate misspelling in filename
    "rhode_island": "RI",
    "rhodeisland": "RI",
    "south_carolina": "SC",
    "southcarolina": "SC",
    "south_dakota": "SD",
    "southdakota": "SD",
    "tennessee": "TN",
    "texas": "TX",
    "utah": "UT",
    "vermont": "VT",
    "virginia": "VA",
    "washington": "WA",
    "west_virginia": "WV",
    "westvirginia": "WV",
    "wisconsin": "WI",
    "wyoming": "WY",
}


DATA_DIR = Path(settings.BASE_DIR) / "legal_data"
PDF_DIR = DATA_DIR / "pdfs"
INDEX_PATH = DATA_DIR / "chunk_index.json"


@dataclass
class ChunkResult:
    state_code: str
    source_name: str
    page: int
    chunk_id: str
    text: str
    score: int


def ensure_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PDF_DIR.mkdir(parents=True, exist_ok=True)


def normalize_text(raw: str) -> str:
    s = raw.replace("\x00", " ")
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def tokenize(text: str) -> List[str]:
    return re.findall(r"[a-z0-9_]+", text.lower())


def infer_state_code_from_filename(filename: str) -> str | None:
    stem = Path(filename).stem.upper()
    m = re.match(r"^([A-Z]{2})\b", stem)
    if m and m.group(1) in STATE_CODES:
        return m.group(1)
    # Also support names like alcohol_TX_law
    for code in STATE_CODES:
        if f"_{code}_" in f"_{stem}_":
            return code
    # Support full state names in file names.
    normalized = re.sub(r"[^a-z0-9]+", "_", Path(filename).stem.lower()).strip("_")
    # Match longer names first (e.g., west_virginia before virginia).
    for state_name, code in sorted(STATE_NAME_TO_CODE.items(), key=lambda kv: len(kv[0]), reverse=True):
        if state_name in normalized:
            return code
    return None


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 200) -> List[str]:
    if not text:
        return []
    out: List[str] = []
    i = 0
    n = len(text)
    while i < n:
        end = min(n, i + chunk_size)
        out.append(text[i:end])
        if end >= n:
            break
        i = max(0, end - overlap)
    return out


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            b = f.read(1024 * 1024)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def load_index() -> Dict[str, Any]:
    ensure_dirs()
    if not INDEX_PATH.exists():
        return {"documents": [], "chunks": []}
    try:
        return json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"documents": [], "chunks": []}


def save_index(index: Dict[str, Any]) -> None:
    ensure_dirs()
    INDEX_PATH.write_text(json.dumps(index, indent=2), encoding="utf-8")


def extract_pdf_pages(pdf_path: Path) -> List[Dict[str, Any]]:
    reader = PdfReader(str(pdf_path))
    pages: List[Dict[str, Any]] = []
    for idx, page in enumerate(reader.pages, start=1):
        text = normalize_text(page.extract_text() or "")
        if text:
            pages.append({"page": idx, "text": text})
    return pages


def build_index_from_pdf_folder(pdf_dir: Path | None = None) -> Dict[str, Any]:
    ensure_dirs()
    source_dir = pdf_dir or PDF_DIR
    index = {"documents": [], "chunks": []}

    for pdf_path in sorted(source_dir.glob("*.pdf")):
        state_code = infer_state_code_from_filename(pdf_path.name) or "UNKNOWN"
        doc_sha = file_sha256(pdf_path)
        pages = extract_pdf_pages(pdf_path)
        doc = {
            "state_code": state_code,
            "source_name": pdf_path.name,
            "path": str(pdf_path),
            "sha256": doc_sha,
            "page_count": len(pages),
        }
        index["documents"].append(doc)

        for p in pages:
            for ci, chunk in enumerate(chunk_text(p["text"])):
                chunk_id = hashlib.sha256(
                    f"{pdf_path.name}:{p['page']}:{ci}:{chunk[:120]}".encode("utf-8")
                ).hexdigest()[:16]
                index["chunks"].append(
                    {
                        "state_code": state_code,
                        "source_name": pdf_path.name,
                        "page": p["page"],
                        "chunk_id": chunk_id,
                        "text": chunk,
                        "tokens": tokenize(chunk),
                    }
                )
    save_index(index)
    return index


def retrieve_chunks(query: str, *, state_code: str | None = None, top_k: int = 6) -> List[ChunkResult]:
    index = load_index()
    q_tokens = set(tokenize(query))
    if not q_tokens:
        return []

    out: List[ChunkResult] = []
    for ch in index.get("chunks", []):
        if state_code and state_code.upper() != ch.get("state_code"):
            continue
        tokens = set(ch.get("tokens", []))
        score = len(q_tokens.intersection(tokens))
        if score <= 0:
            continue
        out.append(
            ChunkResult(
                state_code=ch.get("state_code", "UNKNOWN"),
                source_name=ch.get("source_name", "unknown.pdf"),
                page=int(ch.get("page", 0)),
                chunk_id=ch.get("chunk_id", ""),
                text=ch.get("text", ""),
                score=score,
            )
        )

    out.sort(key=lambda c: c.score, reverse=True)
    return out[:top_k]


def format_citations(chunks: Iterable[ChunkResult]) -> str:
    lines = []
    for c in chunks:
        lines.append(f"- [{c.state_code}] {c.source_name} (page {c.page}, chunk {c.chunk_id})")
    return "\n".join(lines)


def state_corpus_summary(state_code: str) -> Dict[str, Any]:
    """
    Return document/chunk coverage and top citation snippets for a state.
    """
    state_code = (state_code or "").upper()
    index = load_index()
    docs = [d for d in index.get("documents", []) if d.get("state_code") == state_code]
    chunks = [c for c in index.get("chunks", []) if c.get("state_code") == state_code]

    sample = []
    for c in chunks[:5]:
        sample.append(
            {
                "source_name": c.get("source_name"),
                "page": c.get("page"),
                "chunk_id": c.get("chunk_id"),
                "preview": (c.get("text", "")[:220] + "...") if len(c.get("text", "")) > 220 else c.get("text", ""),
            }
        )

    return {
        "state_code": state_code,
        "document_count": len(docs),
        "chunk_count": len(chunks),
        "documents": docs,
        "sample_chunks": sample,
    }

