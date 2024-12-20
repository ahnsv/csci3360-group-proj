from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from src.application import usecase_v2
from src.database.models import Course, CourseMaterial, CourseMembership
from src.deps import AsyncDBSession, CurrentUser

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/")
async def get_courses(db_session: AsyncDBSession, current_user: CurrentUser):
    stmt = select(Course).where(
        Course.hidden is not True,
        Course.id.in_(
            select(CourseMembership.course_id).where(
                CourseMembership.user_id == current_user.id
            )
        ),
    )
    result = await db_session.execute(stmt)
    courses = result.scalars().all()
    return courses


class CourseMaterialOut(BaseModel):
    id: int
    url: str | None
    type: str
    title: str
    updated_at: datetime
    created_at: datetime


class CourseOut(BaseModel):
    id: int
    name: str
    description: str | None
    instructor: str | None
    materials: list[CourseMaterialOut]


@router.get("/{course_id}", response_model=CourseOut)
async def get_course(
    db_session: AsyncDBSession, current_user: CurrentUser, course_id: int
):
    stmt = (
        select(Course, CourseMaterial)
        .join(CourseMaterial, Course.id == CourseMaterial.course_id, isouter=True)
        .where(
            Course.hidden is not True,
            Course.id == course_id,
            Course.id.in_(
                select(CourseMembership.course_id).where(
                    CourseMembership.user_id == current_user.id
                )
            ),
        )
        .order_by(CourseMaterial.updated_at.desc())
    )
    result = await db_session.execute(stmt)
    course_materials = result.all()

    if not course_materials:
        return None

    course = course_materials[0].Course
    course_dict = {
        "id": course.id,
        "name": course.name,
        "description": course.description,
        "instructor": course.instructor,
        "materials": [
            {
                "id": row.CourseMaterial.id,
                "url": row.CourseMaterial.url,
                "type": row.CourseMaterial.type,
                "title": row.CourseMaterial.name,
                "updated_at": row.CourseMaterial.updated_at,
                "created_at": row.CourseMaterial.created_at,
            }
            for row in course_materials
            if row.CourseMaterial is not None
        ],
    }
    return course_dict


@router.get("/{course_id}/materials")
async def get_course_materials(
    db_session: AsyncDBSession, current_user: CurrentUser, course_id: int
):
    stmt = (
        select(CourseMaterial)
        .where(CourseMaterial.course_id == course_id)
        .order_by(CourseMaterial.updated_at.desc())
        .limit(10)
    )
    result = await db_session.execute(stmt)
    materials = result.scalars().all()
    return materials


@router.get("/{course_id}/materials/{material_id}")
async def get_course_material(
    db_session: AsyncDBSession,
    current_user: CurrentUser,
    course_id: int,
    material_id: int,
):
    stmt = select(CourseMaterial).where(
        CourseMaterial.id == material_id, CourseMaterial.course_id == course_id
    )
    result = await db_session.execute(stmt)
    material = result.scalar_one_or_none()
    return material


@router.get("/{course_id}/assignments")
async def list_assignments(
    db_session: AsyncDBSession, current_user: CurrentUser, course_id: int
):
    stmt = select(Course).where(
        Course.id == course_id,
        Course.id.in_(
            select(CourseMembership.course_id).where(
                CourseMembership.user_id == current_user.id
            )
        ),
    )
    result = await db_session.execute(stmt)
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return await usecase_v2.get_upcoming_assignments_and_quizzes(
        session=db_session,
        user_id=current_user.id,
        course_id=course.canvas_id,
        n_days=14,
    )
