from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()

class Profiles(Base):
    __tablename__ = 'profiles'

    id = Column(UUID(as_uuid=True), primary_key=True)
    first_name = Column(Text, nullable=True)
    last_name = Column(Text, nullable=True)
    email = Column(String, unique=True, nullable=True)

    integrations = relationship("Integration", back_populates="profile")

    def __repr__(self):
        return f"<Profiles(id={self.id}, email='{self.email}', first_name='{self.first_name}', last_name='{self.last_name}')>"

class Integration(Base):
    __tablename__ = 'integration'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    type = Column(String, nullable=False)
    token = Column(String, nullable=False)
    expire_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    user_id = Column(UUID(as_uuid=True), ForeignKey('profiles.id', onupdate='CASCADE', ondelete='CASCADE'), nullable=False)
    refresh_token = Column(String, nullable=True)

    profile = relationship("Profiles", back_populates="integrations")

    def __repr__(self):
        return f"<Integration(id={self.id}, type='{self.type}', user_id='{self.user_id}', created_at='{self.created_at}')>"

class Chat(Base):
    __tablename__ = 'chat'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    user_id = Column(UUID(as_uuid=True), ForeignKey('profiles.id', onupdate='CASCADE', ondelete='CASCADE'), nullable=False)
    author = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now(), onupdate=func.now())
    content = Column(String, nullable=True)
    extra = Column(Text, nullable=True)  # Using Text for JSONB representation

    profile = relationship("Profiles")

    def __repr__(self):
        return f"<Chat(id={self.id}, user_id='{self.user_id}', author='{self.author}', created_at='{self.created_at}')>"
