from __future__ import annotations

import csv
import importlib
import io
import json
from dataclasses import dataclass, field
from typing import Any, cast

from app.domain.file_vault import FileKind
from app.models.file_vault import FileRecord


class TextExtractionError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True)
class ExtractedSection:
    text: str
    page_number: int | None = None
    section_label: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ExtractedDocument:
    extractor_name: str
    metadata: dict[str, Any]
    sections: list[ExtractedSection]

    @property
    def text_char_count(self) -> int:
        return sum(len(section.text) for section in self.sections)

    def without_empty_sections(self) -> ExtractedDocument:
        return ExtractedDocument(
            extractor_name=self.extractor_name,
            metadata=self.metadata,
            sections=[section for section in self.sections if section.text.strip()],
        )


class FileTextExtractor:
    def extract(self, file: FileRecord, content: bytes) -> ExtractedDocument:
        kind = FileKind(file.file_kind)
        if kind in {
            FileKind.TEXT,
            FileKind.MARKDOWN,
            FileKind.SOURCE_CODE,
        }:
            return self._extract_plain_text(file, content, extractor_name=f"{kind.value}_text")
        if kind == FileKind.CSV:
            return self._extract_csv(file, content)
        if kind == FileKind.JSON:
            return self._extract_json(file, content)
        if kind == FileKind.PDF:
            return self._extract_pdf(content)
        if kind == FileKind.DOCX:
            return self._extract_docx(content)
        if kind == FileKind.IMAGE:
            return ExtractedDocument(
                extractor_name="image_metadata_only",
                metadata={"textExtraction": "not_supported_without_ocr"},
                sections=[],
            )
        raise TextExtractionError("unsupported_file_kind", "File kind is not supported.")

    def _extract_plain_text(
        self,
        file: FileRecord,
        content: bytes,
        *,
        extractor_name: str,
    ) -> ExtractedDocument:
        text = decode_text(content)
        sections = [
            ExtractedSection(
                text=section,
                section_label=f"section-{index + 1}",
                metadata={"split": "form_feed" if "\f" in text else "document"},
            )
            for index, section in enumerate(part.strip() for part in text.split("\f"))
            if section
        ]
        return ExtractedDocument(
            extractor_name=extractor_name,
            metadata={"contentType": file.content_type},
            sections=sections,
        )

    def _extract_csv(self, file: FileRecord, content: bytes) -> ExtractedDocument:
        text = decode_text(content)
        try:
            rows = list(csv.reader(io.StringIO(text)))
        except csv.Error as exc:
            raise TextExtractionError("csv_parse_failed", "CSV text could not be parsed.") from exc

        rendered = "\n".join(" | ".join(cell.strip() for cell in row) for row in rows)
        return ExtractedDocument(
            extractor_name="csv_text",
            metadata={"contentType": file.content_type, "rowCount": len(rows)},
            sections=[ExtractedSection(text=rendered, section_label="csv")] if rendered else [],
        ).without_empty_sections()

    def _extract_json(self, file: FileRecord, content: bytes) -> ExtractedDocument:
        text = decode_text(content)
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError as exc:
            raise TextExtractionError(
                "json_parse_failed", "JSON text could not be parsed."
            ) from exc

        rendered = json.dumps(parsed, ensure_ascii=True, indent=2, sort_keys=True)
        return ExtractedDocument(
            extractor_name="json_text",
            metadata={"contentType": file.content_type},
            sections=[ExtractedSection(text=rendered, section_label="json")],
        )

    def _extract_pdf(self, content: bytes) -> ExtractedDocument:
        try:
            pypdf = cast(Any, importlib.import_module("pypdf"))
        except ModuleNotFoundError as exc:
            raise TextExtractionError(
                "pdf_extractor_unavailable",
                "PDF extraction requires the pypdf package.",
            ) from exc

        try:
            reader = pypdf.PdfReader(io.BytesIO(content))
            sections = [
                ExtractedSection(
                    text=(page.extract_text() or "").strip(),
                    page_number=index + 1,
                    section_label=f"page-{index + 1}",
                )
                for index, page in enumerate(reader.pages)
            ]
        except Exception as exc:
            raise TextExtractionError(
                "pdf_parse_failed", "PDF text could not be extracted."
            ) from exc

        return ExtractedDocument(
            extractor_name="pypdf",
            metadata={"pageCount": len(reader.pages)},
            sections=[section for section in sections if section.text],
        )

    def _extract_docx(self, content: bytes) -> ExtractedDocument:
        try:
            docx = cast(Any, importlib.import_module("docx"))
        except ModuleNotFoundError as exc:
            raise TextExtractionError(
                "docx_extractor_unavailable",
                "DOCX extraction requires the python-docx package.",
            ) from exc

        try:
            document = docx.Document(io.BytesIO(content))
            paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs]
        except Exception as exc:
            raise TextExtractionError(
                "docx_parse_failed", "DOCX text could not be extracted."
            ) from exc

        text = "\n".join(paragraph for paragraph in paragraphs if paragraph)
        return ExtractedDocument(
            extractor_name="python-docx",
            metadata={"paragraphCount": len(paragraphs)},
            sections=[ExtractedSection(text=text, section_label="document")] if text else [],
        ).without_empty_sections()


def decode_text(content: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-8", "cp1252"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    return content.decode("utf-8", errors="replace")
