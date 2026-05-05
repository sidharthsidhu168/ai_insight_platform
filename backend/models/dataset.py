"""
Dataset model schema for MongoDB
"""
import uuid
from datetime import datetime

class Dataset:
    """Represents a dataset document in MongoDB"""
    
    def __init__(self, user_id, filename, saved_as, columns, row_count):
        self.dataset_id = str(uuid.uuid4())
        self.user_id = user_id
        self.filename = filename
        self.saved_as = saved_as
        self.columns = columns
        self.row_count = row_count
        self.uploaded_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary for MongoDB insertion"""
        return {
            "dataset_id": self.dataset_id,
            "user_id": self.user_id,
            "filename": self.filename,
            "saved_as": self.saved_as,
            "columns": self.columns,
            "row_count": self.row_count,
            "uploaded_at": self.uploaded_at
        }
    
    @staticmethod
    def to_response(dataset_doc):
        """Convert MongoDB document to response dict"""
        if dataset_doc:
            dataset_doc.pop('_id', None)
            dataset_doc.pop('saved_as', None)
        return dataset_doc
    
    @staticmethod
    def validate_columns(columns):
        """Validate that columns list is not empty"""
        return columns and isinstance(columns, list) and len(columns) > 0
    
    @staticmethod
    def validate_row_count(row_count):
        """Validate that row count is positive"""
        return isinstance(row_count, int) and row_count > 0
