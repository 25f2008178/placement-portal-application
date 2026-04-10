import enum
from datetime import datetime, timezone

from flask_security.models import sqla
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Model(DeclarativeBase):
    pass


sqla.FsModels.set_db_info(base_model=Model)


class Role(Model, sqla.FsRoleMixin):
    __tablename__ = "role"


class User(Model, sqla.FsUserMixin):
    __tablename__ = "user"
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    drives: Mapped[list["RecruitmentDrive"]] = relationship(back_populates="company")
    applications: Mapped[list["Application"]] = relationship(back_populates="student")


class RecruitmentDrive(Model):
    __tablename__ = "recruitment_drive"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[str] = mapped_column(Text, nullable=True)

    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False)

    company_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.now(timezone.utc))

    company = relationship("User", back_populates="drives")
    applications = relationship(
        "Application", back_populates="drive", cascade="all, delete-orphan"
    )


class ApplicationStatus(enum.Enum):
    APPLIED = "applied"
    SHORTLISTED = "shortlisted"
    SELECTED = "selected"
    REJECTED = "rejected"


class Application(Model):
    __tablename__ = "application"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    drive_id: Mapped[int] = mapped_column(
        ForeignKey("recruitment_drive.id"), nullable=False
    )
    student_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)

    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus), default=ApplicationStatus.APPLIED, nullable=False
    )

    resume_link: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    student = relationship("User", back_populates="applications")
    drive = relationship("RecruitmentDrive", back_populates="applications")
