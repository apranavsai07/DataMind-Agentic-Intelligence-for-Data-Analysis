from abc import ABC, abstractmethod


class BaseParser(ABC):

    @staticmethod
    @abstractmethod
    def parse(file_path):
        pass