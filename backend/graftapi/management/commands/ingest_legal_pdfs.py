from __future__ import annotations

from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from graftapi.legal_rag import DATA_DIR, build_index_from_pdf_folder, ensure_dirs


class Command(BaseCommand):
    help = "Ingest legal PDF files and build chunk index for Legal Insight retrieval."

    def add_arguments(self, parser):
        parser.add_argument(
            "--pdf-dir",
            type=str,
            default=None,
            help="Directory with PDFs. Defaults to <BASE_DIR>/legal_data/pdfs",
        )

    def handle(self, *args, **options):
        ensure_dirs()
        pdf_dir_opt = options.get("pdf_dir")
        pdf_dir = Path(pdf_dir_opt) if pdf_dir_opt else (DATA_DIR / "pdfs")

        self.stdout.write(f"Ingesting PDFs from: {pdf_dir}")
        if not pdf_dir.exists():
            self.stderr.write(
                self.style.ERROR(
                    f"PDF directory does not exist: {pdf_dir}\n"
                    "Create it and add files like TX_alcohol_law.pdf, NY_alcohol_law.pdf, etc."
                )
            )
            return

        index = build_index_from_pdf_folder(pdf_dir)
        doc_count = len(index.get("documents", []))
        chunk_count = len(index.get("chunks", []))
        state_count = len({d.get("state_code") for d in index.get("documents", [])})

        self.stdout.write(self.style.SUCCESS("Legal PDF ingestion complete."))
        self.stdout.write(f"- Documents: {doc_count}")
        self.stdout.write(f"- Chunks: {chunk_count}")
        self.stdout.write(f"- States covered (detected): {state_count}")
        self.stdout.write(
            f"- Index file: {Path(settings.BASE_DIR) / 'legal_data' / 'chunk_index.json'}"
        )

