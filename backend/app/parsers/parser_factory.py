from app.parsers.csv_parser import CSVParser
from app.parsers.excel_parser import ExcelParser
from app.parsers.pdf_parser import PDFParser
from app.parsers.word_parser import WordParser
from app.parsers.json_parser import JSONParser


class ParserFactory:

    _parsers = {
        ".csv": CSVParser,
        ".xlsx": ExcelParser,
        ".xls": ExcelParser,
        ".pdf": PDFParser,
        ".docx": WordParser,
        ".json": JSONParser,
    }

    @classmethod
    def get_parser(cls, extension):

        parser = cls._parsers.get(extension)

        if parser is None:
            raise ValueError(
                f"Unsupported file type: {extension}"
            )

        return parser