from typing import List

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc, select

from src.application.jobs import extract_course_content
from src.database.models import Integration, Job, JobStatus, JobType
from src.deps import AsyncDBSession, CurrentUser
from src.settings import settings

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobResponse(BaseModel):
    id: int
    type: str
    status: str
    error_message: str | None
    created_at: str
    updated_at: str


async def run_course_sync(
    db_session: AsyncDBSession,
    user_id: str,
    job_id: int,
):
    try:
        # Get Canvas integration
        stmt = select(Integration).where(
            Integration.user_id == user_id, Integration.type == "canvas"
        )
        result = await db_session.execute(stmt)
        integration = result.scalar_one_or_none()

        if not integration:
            raise Exception("Canvas integration not found")

        # Update job status to IN_PROGRESS
        stmt = (
            Job.__table__.update()
            .where(Job.id == job_id)
            .values(status=JobStatus.IN_PROGRESS)
        )
        await db_session.execute(stmt)
        await db_session.commit()
        await db_session.refresh(integration)

        assert integration.token is not None

        # Run the extraction
        await extract_course_content(
            canvas_api_url=settings.canvas_api_url,
            canvas_api_key=integration.token,
            db_session=db_session,
            user_id=user_id,
        )

        # Update job status to COMPLETED
        stmt = (
            Job.__table__.update()
            .where(Job.id == job_id)
            .values(status=JobStatus.COMPLETED)
        )
        await db_session.execute(stmt)
        await db_session.commit()

    except Exception as e:
        # Update job status to FAILED with error message
        stmt = (
            Job.__table__.update()
            .where(Job.id == job_id)
            .values(status=JobStatus.FAILED, error_message=str(e))
        )
        await db_session.execute(stmt)
        await db_session.commit()
        raise


@router.post("/course-sync", response_model=JobResponse)
async def trigger_course_sync(
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db_session: AsyncDBSession,
):
    """Trigger a course sync job"""
    # Create new job record
    job = Job(
        type=JobType.COURSE_SYNC,
        status=JobStatus.PENDING,
        user_id=current_user.id,
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)

    # Start background task
    background_tasks.add_task(
        run_course_sync,
        db_session=db_session,
        user_id=str(current_user.id),
        job_id=job.id,
    )

    return JobResponse(
        id=job.id,
        type=job.type.value,
        status=job.status.value,
        error_message=job.error_message,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat(),
    )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job_status(
    job_id: int,
    current_user: CurrentUser,
    db_session: AsyncDBSession,
):
    """Get status of a specific job"""
    stmt = select(Job).where(Job.id == job_id, Job.user_id == current_user.id)
    result = await db_session.execute(stmt)
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobResponse(
        id=job.id,
        type=job.type.value,
        status=job.status.value,
        error_message=job.error_message,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat(),
    )


@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    current_user: CurrentUser,
    db_session: AsyncDBSession,
    limit: int = 10,
    offset: int = 0,
):
    """List jobs for the current user, ordered by creation date (newest first)"""
    stmt = (
        select(Job)
        .where(Job.user_id == current_user.id)
        .order_by(desc(Job.created_at))
        .limit(limit)
        .offset(offset)
    )

    result = await db_session.execute(stmt)
    jobs = result.scalars().all()

    return [
        JobResponse(
            id=job.id,
            type=job.type.value,
            status=job.status.value,
            error_message=job.error_message,
            created_at=job.created_at.isoformat(),
            updated_at=job.updated_at.isoformat(),
        )
        for job in jobs
    ]
