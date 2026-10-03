from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class Document:
    filename: str
    file_type: str
    content_type: str
    content: Any
    metadata: dict

    dataset_id: Optional[str] = None
    storage_path: Optional[str] = None