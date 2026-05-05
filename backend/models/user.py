"""
User model schema for MongoDB
"""

class User:
    """Represents a user document in MongoDB"""
    
    def __init__(self, email, name, password_hash, created_at=None):
        self.email = email.lower()
        self.name = name
        self.password = password_hash
        self.created_at = created_at
    
    @staticmethod
    def to_dict(user_doc):
        """Convert MongoDB document to dict, excluding password"""
        if user_doc:
            user_doc.pop('password', None)
            user_doc['_id'] = str(user_doc.get('_id', ''))
        return user_doc
    
    @staticmethod
    def validate_email(email):
        """Simple email validation"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_password(password):
        """Validate password strength"""
        if len(password) < 8:
            return False, "Password must be at least 8 characters"
        if not any(char.isupper() for char in password):
            return False, "Password must contain at least 1 uppercase letter"
        if not any(char.isdigit() for char in password):
            return False, "Password must contain at least 1 number"
        return True, "Valid"
    
    @staticmethod
    def validate_name(name):
        """Validate name"""
        if not name or len(name.strip()) < 2:
            return False
        return True
