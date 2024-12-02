from canvasapi import Canvas
from PyPDF2 import PdfReader
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert

from src.database.models import (
    Course,
    CourseMaterial,
    CourseMaterialType,
    CourseMembership,
    MaterialDocument,
)
from src.deps import AsyncDBSession


def get_course_list(canvas_api_url: str, canvas_api_key: str):
    canvas = Canvas(canvas_api_url, canvas_api_key)
    courses = canvas.get_courses(
        enrollment_state="active",
        enrollment_type="student",
        enrollment_role="StudentEnrollment",
        state="available",
    )
    return courses


def get_course_details(canvas_api_url: str, canvas_api_key: str, course_id: str):
    canvas = Canvas(canvas_api_url, canvas_api_key)
    course = canvas.get_course(
        course_id, include=["syllabus_body", "course_image", "teachers"]
    )
    return course


def get_course_enrollments(canvas_api_url: str, canvas_api_key: str, course_id: str):
    import requests

    response = requests.get(
        f"{canvas_api_url}/api/v1/courses/{course_id}/enrollments?type[]=TeacherEnrollment",
        headers={"Authorization": f"Bearer {canvas_api_key}"},
    )
    return response.json()


def get_course_files(canvas_api_url: str, canvas_api_key: str, course_id: str):
    import requests

    response = requests.get(
        f"{canvas_api_url}/api/v1/courses/{course_id}/files",
        headers={"Authorization": f"Bearer {canvas_api_key}"},
    )
    if response.status_code != 200:
        return []
    return response.json()


def get_course_modules(canvas_api_url: str, canvas_api_key: str, course_id: str):
    import requests

    response = requests.get(
        f"{canvas_api_url}/api/v1/courses/{course_id}/modules",
        headers={"Authorization": f"Bearer {canvas_api_key}"},
    )
    return response.json()


def get_course_module_items(
    canvas_api_url: str, canvas_api_key: str, course_id: str, module_id: str
):
    import requests

    response = requests.get(
        f"{canvas_api_url}/api/v1/courses/{course_id}/modules/{module_id}/items",
        headers={"Authorization": f"Bearer {canvas_api_key}"},
    )
    return response.json()


def get_course_file_url(
    canvas_api_url: str, canvas_api_key: str, course_id: str, file_id: str
):
    import requests

    response = requests.get(
        f"{canvas_api_url}/api/v1/courses/{course_id}/files/{file_id}",
        headers={"Authorization": f"Bearer {canvas_api_key}"},
    )
    return response.json()


async def extract_course_content(
    canvas_api_url: str,
    canvas_api_key: str,
    db_session: AsyncDBSession,
    user_id: str,
):
    course_list = get_course_list(canvas_api_url, canvas_api_key)

    for course in course_list:
        details = get_course_details(canvas_api_url, canvas_api_key, course.id)
        instructors = details.teachers[0]["display_name"]
        files = get_course_files(canvas_api_url, canvas_api_key, course.id)
        all_module_items = []
        modules = get_course_modules(canvas_api_url, canvas_api_key, course.id)
        for module in modules:
            module_items = get_course_module_items(
                canvas_api_url, canvas_api_key, course.id, module["id"]
            )
            all_module_items.extend(module_items)

        stmt = insert(Course).values(
            name=details.name,
            instructor=instructors,
            code=details.course_code,
            canvas_id=course.id,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[Course.name],
            set_=dict(
                instructor=instructors,
                code=details.course_code,
                canvas_id=course.id,
                updated_at=func.now(),
            ),
        )
        stmt = stmt.returning(Course)
        result = await db_session.execute(stmt)
        course = result.scalar_one_or_none()
        if not course:
            raise Exception("Course not found")

        stmt = insert(CourseMembership).values(course_id=course.id, user_id=user_id)
        stmt = stmt.on_conflict_do_nothing()
        stmt = stmt.returning(CourseMembership)
        result = await db_session.execute(stmt)
        course_membership = result.scalar_one_or_none()
        if not course_membership:
            continue

        course_materials = []
        for file in files:
            course_material_type = (
                CourseMaterialType.PDF
                if file["display_name"].endswith(".pdf")
                else CourseMaterialType.URL
            )
            url = file.get("url")
            course_material = {
                "course_id": course.id,
                "type": course_material_type,
                "url": url,
                "name": file["display_name"],
                "canvas_id": f"file_{file['id']}",
            }
            course_materials.append(course_material)

        for module_item in all_module_items:
            course_material_type = (
                CourseMaterialType.PDF
                if module_item["title"].endswith(".pdf")
                else CourseMaterialType.URL
            )
            content_id = module_item.get("content_id")
            if not content_id:
                continue

            file = get_course_file_url(
                canvas_api_url, canvas_api_key, course.canvas_id, content_id
            )
            if file.get("errors"):
                continue

            if not bool([file.get("url"), file.get("display_name"), file.get("id")]):
                continue

            course_material = {
                "course_id": course.id,
                "type": course_material_type,
                "url": file.get("url"),
                "name": file.get("display_name"),
                "canvas_id": f"file_{file.get('id')}",
            }
            course_materials.append(course_material)

        # upsert course and course materials
        if not course_materials:
            continue

        # make sure course_materials are unique
        course_materials = list(
            {
                course_material["name"]: course_material
                for course_material in course_materials
            }.values()
        )

        stmt = insert(CourseMaterial).values(course_materials)
        stmt = stmt.on_conflict_do_update(
            index_elements=[CourseMaterial.name, CourseMaterial.course_id],
            set_=dict(
                url=stmt.excluded.url,
                type=stmt.excluded.type,
                canvas_id=stmt.excluded.canvas_id,
                updated_at=func.now(),
            ),
        )
        stmt = stmt.returning(CourseMaterial)
        result = await db_session.execute(stmt)
        course_materials = result.scalars().all()
        await db_session.commit()


async def process_course_materials(
    course_materials: list[CourseMaterial],
    db_session: AsyncDBSession,
):
    """Process course materials by extracting text, chunking, and generating embeddings"""
    import io

    import nltk
    import requests

    from src.application.openai import aclient

    client = await aclient()
    nltk.download("punkt_tab")

    def chunk_text(text: str, chunk_size: int = 1000) -> list[str]:
        """Split text into chunks at sentence boundaries"""
        sentences = nltk.sent_tokenize(text)
        chunks = []
        current_chunk = []
        current_size = 0

        for sentence in sentences:
            sentence_size = len(sentence)
            if current_size + sentence_size > chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = []
                current_size = 0
            current_chunk.append(sentence)
            current_size += sentence_size

        if current_chunk:
            chunks.append(" ".join(current_chunk))
        return chunks

    async def generate_embedding(text: str):
        """Generate embedding using OpenAI API"""
        response = await client.embeddings.create(
            model="text-embedding-ada-002", input=text
        )
        return response.data[0].embedding

    for material in course_materials:
        if not material.name.lower().endswith(".pdf"):
            print(f"Skipping {material.name} because it is not a PDF")
            continue

        try:
            # Download PDF
            response = requests.get(material.url)
            pdf_file = io.BytesIO(response.content)

            # Extract text
            reader = PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()

            # Chunk text
            chunks = chunk_text(text)

            # Generate embeddings and store documents
            for index, chunk in enumerate(chunks):
                embedding = await generate_embedding(chunk)
                document = MaterialDocument(
                    content=chunk,
                    meta_data={
                        "course_id": material.course_id,
                        "course_material_id": material.id,
                        "source": material.url,
                        "name": material.name,
                        "index": index,
                        "total_chunks": len(chunks),
                    },
                    embedding=embedding,
                )
                db_session.add(document)

            await db_session.commit()

        except Exception as e:
            print(f"Error processing {material.url}: {str(e)}")
            continue


if __name__ == "__main__":
    import asyncio

    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    from src.settings import settings

    engine = create_async_engine(settings.database_url)
    async_session = async_sessionmaker(bind=engine)

    async def main():
        async with async_session() as session:
            await extract_course_content(
                canvas_api_url=settings.canvas_api_url,
                canvas_api_key=settings.canvas_api_token,
                db_session=session,
                user_id="",
            )

    asyncio.run(main())
