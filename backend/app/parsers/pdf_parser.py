from pypdf import PdfReader

from app.models.document import Document
from app.parsers.base_parser import BaseParser


class PDFParser(BaseParser):

    @staticmethod
    def parse(file_path):

        reader = PdfReader(file_path)

        text = ""
        pages = []

        for page in reader.pages:
            page_text = page.extract_text() or ""
            pages.append(page_text)
            text += page_text + "\n"

        return Document(
            filename=file_path.name,
            file_type="pdf",
            content_type="text",
            content = {
                    "full_text": text,
                        "pages": pages
                    },
            metadata={
                "pages": len(reader.pages),
                "characters": len(text),
                "words": len(text.split())
            }
        )