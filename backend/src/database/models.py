import enum

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class Profiles(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True)
    first_name = Column(Text, nullable=True)
    last_name = Column(Text, nullable=True)
    email = Column(String, unique=True, nullable=True)

    integrations = relationship("Integration", back_populates="profile")

    def __repr__(self):
        return f"<Profiles(id={self.id}, email='{self.email}', first_name='{self.first_name}', last_name='{self.last_name}')>"


class Integration(Base):
    __tablename__ = "integration"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    type = Column(String, nullable=False)
    token = Column(String, nullable=False)
    expire_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    refresh_token = Column(String, nullable=True)

    profile = relationship("Profiles", back_populates="integrations", lazy="selectin")

    def __repr__(self):
        return f"<Integration(id={self.id}, type='{self.type}', user_id='{self.user_id}', created_at='{self.created_at}')>"


class Chat(Base):
    __tablename__ = "chat"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    author = Column(String, nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        nullable=True,
        server_default=func.now(),
        onupdate=func.now(),
    )
    content = Column(String, nullable=True)
    # extra = Column(J, nullable=True)  # Using Text for JSONB representation

    profile = relationship("Profiles")

    def __repr__(self):
        return f"<Chat(id={self.id}, user_id='{self.user_id}', author='{self.author}', created_at='{self.created_at}')>"


class TaskType(enum.Enum):
    ASSIGNMENT = "ASSIGNMENT"
    STUDY = "STUDY"
    SOCIAL = "SOCIAL"
    CHORE = "CHORE"


class Task(Base):
    __tablename__ = "task"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    start_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    end_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    due_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    link = Column(String, nullable=True)
    type = Column(Enum(TaskType, name="TASK_TYPE"), nullable=False)

    profile = relationship("Profiles", lazy="selectin")

    def __repr__(self):
        return f"<Task(id={self.id}, name='{self.name}', user_id='{self.user_id}', type='{self.type}')>"


class Course(Base):
    __tablename__ = "course"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    link = Column(String, nullable=True)
    instructor = Column(String, nullable=True)
    code = Column(String, nullable=True)
    canvas_id = Column(BigInteger, nullable=True)
    hidden = Column(Boolean, nullable=False, default=False)

    # user_id = Column(UUID(as_uuid=True), ForeignKey('profiles.id', onupdate='CASCADE', ondelete='CASCADE'), nullable=False)

    # profile = relationship("Profiles")

    def __repr__(self):
        return f"<Course(id={self.id}, name='{self.name}', instructor='{self.instructor}')>"


class CourseMaterialType(enum.Enum):
    PDF = "PDF"
    IMAGE = "IMAGE"
    URL = "URL"


class CourseMaterial(Base):
    __tablename__ = "course_material"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    course_id = Column(
        BigInteger,
        ForeignKey("course.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    type = Column(Enum(CourseMaterialType, name="COURSE_MATERIAL_TYPE"), nullable=False)
    url = Column(String, nullable=True)
    name = Column(String, nullable=True)
    canvas_id = Column(String, nullable=True)

    course = relationship("Course")

    # add unique constraint on course_id and name
    __table_args__ = (
        UniqueConstraint("name", "course_id", name="unique_name_course_id"),
    )

    def __repr__(self):
        return f"<CourseMaterial(id={self.id}, course_id='{self.course_id}', type='{self.type}', name='{self.name}')>"


class CourseMembership(Base):
    __tablename__ = "course_membership"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    course_id = Column(
        BigInteger,
        ForeignKey("course.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )

    course = relationship("Course")

    def __repr__(self):
        return f"<CourseMembership(id={self.id}, course_id='{self.course_id}', user_id='{self.user_id}')>"


class Preference(Base):
    __tablename__ = "preference"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    study_type = Column(String, nullable=True, server_default="morning")
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=True,
        unique=True
    )
    task_extraction_prompt = Column(Text, nullable=True)
    scheduling_prompt = Column(Text, nullable=True) 
    primary_calendar = Column(Text, nullable=True)

    def __repr__(self):
        return f"<Preference(id={self.id}, user_id='{self.user_id}', study_type='{self.study_type}')>"


class JobStatus(enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class JobType(enum.Enum):
    COURSE_SYNC = "COURSE_SYNC"

class Job(Base):
    __tablename__ = "job"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    type = Column(Enum(JobType, name="job_type"), nullable=False)
    status = Column(Enum(JobStatus, name="job_status"), nullable=False, default=JobStatus.PENDING)
    error_message = Column(Text, nullable=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )

    profile = relationship("Profiles", lazy="selectin")

    def __repr__(self):
        return f"<Job(id={self.id}, type='{self.type}', status='{self.status}', user_id='{self.user_id}')>"
