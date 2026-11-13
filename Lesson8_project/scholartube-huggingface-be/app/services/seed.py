from __future__ import annotations

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.learning import Course, CourseSection, Enrollment, Lesson, Review, User
from app.models.video import Video
from app.services.auth import hash_password


DEMO_PASSWORD = "Demo@12345"


def seed_demo_data() -> None:
    db = SessionLocal()
    try:
        users = {
            "student": _get_or_create_user(
                db,
                name="An Nguyen",
                email="student@scholartube.edu",
                role="student",
                avatar_url="https://i.pravatar.cc/120?img=12",
                password=DEMO_PASSWORD,
            ),
            "admin": _get_or_create_user(
                db,
                name="Linh Admin",
                email="admin@scholartube.edu",
                role="admin",
                avatar_url="https://i.pravatar.cc/120?img=32",
                password=DEMO_PASSWORD,
            ),
            "python": _get_or_create_user(
                db,
                name="Dr. Minh Tran",
                email="minh.tran@scholartube.edu",
                role="instructor",
                avatar_url="https://i.pravatar.cc/120?img=48",
                password=DEMO_PASSWORD,
            ),
            "math": _get_or_create_user(
                db,
                name="Prof. Mai Le",
                email="mai.le@scholartube.edu",
                role="instructor",
                avatar_url="https://i.pravatar.cc/120?img=47",
                password=DEMO_PASSWORD,
            ),
            "ai": _get_or_create_user(
                db,
                name="Khoa Pham",
                email="khoa.pham@scholartube.edu",
                role="instructor",
                avatar_url="https://i.pravatar.cc/120?img=51",
                password=DEMO_PASSWORD,
            ),
        }
        db.flush()

        if db.scalar(select(Course).limit(1)):
            db.commit()
            return

        courses = [
            {
                "instructor": users["python"],
                "title": "Python Foundations for AI",
                "slug": "python-foundations-for-ai",
                "subtitle": "Nắm Python thực dụng trước khi bước vào data, ML và automation.",
                "description": "Khóa học đưa người mới từ cú pháp Python, control flow, functions đến tư duy xử lý dữ liệu cho bài toán AI.",
                "category": "Python cơ bản",
                "level": "Beginner",
                "price": 19.99,
                "rating": 4.7,
                "rating_count": 1324,
                "students_count": 18420,
                "thumbnail_url": _thumbnail("kqtD5dpn9C8"),
                "sections": [
                    {
                        "title": "Python nhập môn",
                        "lessons": [
                            {
                                "title": "Python in 100 Seconds",
                                "description": "Bức tranh nhanh về Python và vì sao Python phổ biến trong AI.",
                                "duration_minutes": 2,
                                "youtube_url": "https://www.youtube.com/watch?v=x7X9w_GIm1s",
                                "is_preview": True,
                            },
                            {
                                "title": "Python for Beginners",
                                "description": "Cú pháp nền tảng, biến, điều kiện, vòng lặp và hàm.",
                                "duration_minutes": 60,
                                "youtube_url": "https://www.youtube.com/watch?v=kqtD5dpn9C8",
                                "is_preview": True,
                            },
                        ],
                    },
                    {
                        "title": "Tư duy code cho AI",
                        "lessons": [
                            {
                                "title": "Python Full Course Overview",
                                "description": "Một bài dài để luyện cấu trúc chương trình và workflow Python.",
                                "duration_minutes": 360,
                                "youtube_url": "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
                                "is_preview": False,
                            }
                        ],
                    },
                ],
            },
            {
                "instructor": users["math"],
                "title": "Mathematics for AI",
                "slug": "mathematics-for-ai",
                "subtitle": "Linear algebra, vector intuition và gradient descent cho người học ML.",
                "description": "Khóa học tập trung vào trực giác toán học phía sau mô hình học máy: vector, ma trận, đạo hàm và tối ưu.",
                "category": "Toán học cho AI",
                "level": "Beginner to Intermediate",
                "price": 24.99,
                "rating": 4.8,
                "rating_count": 986,
                "students_count": 12980,
                "thumbnail_url": _thumbnail("fNk_zzaMoSs"),
                "sections": [
                    {
                        "title": "Linear algebra trực quan",
                        "lessons": [
                            {
                                "title": "Vectors, what even are they?",
                                "description": "Trực giác vector, không gian và biểu diễn dữ liệu.",
                                "duration_minutes": 10,
                                "youtube_url": "https://www.youtube.com/watch?v=fNk_zzaMoSs",
                                "is_preview": True,
                            },
                            {
                                "title": "Linear combinations, span, and basis vectors",
                                "description": "Cách vector kết hợp để tạo không gian biểu diễn.",
                                "duration_minutes": 9,
                                "youtube_url": "https://www.youtube.com/watch?v=k7RM-ot2NWY",
                                "is_preview": False,
                            },
                        ],
                    },
                    {
                        "title": "Optimization",
                        "lessons": [
                            {
                                "title": "Gradient descent, how neural networks learn",
                                "description": "Cốt lõi của tối ưu trong ML/DL.",
                                "duration_minutes": 22,
                                "youtube_url": "https://www.youtube.com/watch?v=IHZwWFHWa-w",
                                "is_preview": False,
                            }
                        ],
                    },
                ],
            },
            {
                "instructor": users["ai"],
                "title": "Deep Learning Core Concepts",
                "slug": "deep-learning-core-concepts",
                "subtitle": "Hiểu neural network, backpropagation và cách mô hình học.",
                "description": "Khóa học đi qua neural networks bằng trực giác, sau đó dùng AI study tools để củng cố bài học bằng summary và flashcards.",
                "category": "ML/DL",
                "level": "Intermediate",
                "price": 34.99,
                "rating": 4.9,
                "rating_count": 2110,
                "students_count": 24500,
                "thumbnail_url": _thumbnail("aircAruvnKk"),
                "sections": [
                    {
                        "title": "Neural networks",
                        "lessons": [
                            {
                                "title": "But what is a neural network?",
                                "description": "Ý tưởng neuron, layers, weights và learning.",
                                "duration_minutes": 19,
                                "youtube_url": "https://www.youtube.com/watch?v=aircAruvnKk",
                                "is_preview": True,
                            },
                            {
                                "title": "What is backpropagation really doing?",
                                "description": "Giải thích cách tín hiệu lỗi đi ngược qua mạng.",
                                "duration_minutes": 13,
                                "youtube_url": "https://www.youtube.com/watch?v=Ilg3gGewQ5U",
                                "is_preview": False,
                            },
                        ],
                    },
                    {
                        "title": "Training intuition",
                        "lessons": [
                            {
                                "title": "Backpropagation calculus",
                                "description": "Đạo hàm phía sau backpropagation cho người muốn đào sâu.",
                                "duration_minutes": 10,
                                "youtube_url": "https://www.youtube.com/watch?v=tIeHLnjs5U8",
                                "is_preview": False,
                            }
                        ],
                    },
                ],
            },
            {
                "instructor": users["ai"],
                "title": "Computer Vision Primer",
                "slug": "computer-vision-primer",
                "subtitle": "Từ ảnh số đến convolutional neural networks.",
                "description": "Lộ trình nhập môn Computer Vision, tập trung vào cách mô hình nhìn ảnh và học đặc trưng.",
                "category": "Computer Vision",
                "level": "Intermediate",
                "price": 29.99,
                "rating": 4.6,
                "rating_count": 742,
                "students_count": 8200,
                "thumbnail_url": _thumbnail("YRhxdVk_sIs"),
                "sections": [
                    {
                        "title": "Image understanding",
                        "lessons": [
                            {
                                "title": "Convolutional Neural Networks explained",
                                "description": "Khái niệm convolution, filters và feature maps.",
                                "duration_minutes": 12,
                                "youtube_url": "https://www.youtube.com/watch?v=YRhxdVk_sIs",
                                "is_preview": True,
                            },
                            {
                                "title": "Computer Vision basics",
                                "description": "Tổng quan pipeline thị giác máy tính hiện đại.",
                                "duration_minutes": 18,
                                "youtube_url": "https://www.youtube.com/watch?v=2hXG8v8p0KM",
                                "is_preview": False,
                            },
                        ],
                    }
                ],
            },
            {
                "instructor": users["ai"],
                "title": "NLP and Transformer Essentials",
                "slug": "nlp-transformer-essentials",
                "subtitle": "Từ xử lý ngôn ngữ tự nhiên đến attention và transformers.",
                "description": "Khóa học giúp người học hiểu NLP hiện đại và vì sao transformers thay đổi cách xây mô hình ngôn ngữ.",
                "category": "NLP",
                "level": "Intermediate",
                "price": 39.99,
                "rating": 4.8,
                "rating_count": 1598,
                "students_count": 17340,
                "thumbnail_url": _thumbnail("wjZofJX0v4M"),
                "sections": [
                    {
                        "title": "Language models",
                        "lessons": [
                            {
                                "title": "Attention in transformers, visually explained",
                                "description": "Cách attention giúp mô hình chọn thông tin quan trọng trong chuỗi.",
                                "duration_minutes": 27,
                                "youtube_url": "https://www.youtube.com/watch?v=wjZofJX0v4M",
                                "is_preview": True,
                            },
                            {
                                "title": "Transformers explained",
                                "description": "Tổng quan kiến trúc transformer và ứng dụng trong NLP.",
                                "duration_minutes": 16,
                                "youtube_url": "https://www.youtube.com/watch?v=ZXiruGOCn9s",
                                "is_preview": False,
                            },
                        ],
                    }
                ],
            },
        ]

        created_courses: list[Course] = []
        for course_data in courses:
            course = Course(
                instructor_id=course_data["instructor"].id,
                title=course_data["title"],
                slug=course_data["slug"],
                subtitle=course_data["subtitle"],
                description=course_data["description"],
                category=course_data["category"],
                level=course_data["level"],
                language="Vietnamese",
                price=course_data["price"],
                rating=course_data["rating"],
                rating_count=course_data["rating_count"],
                students_count=course_data["students_count"],
                duration_minutes=sum(
                    lesson["duration_minutes"]
                    for section in course_data["sections"]
                    for lesson in section["lessons"]
                ),
                thumbnail_url=course_data["thumbnail_url"],
            )
            db.add(course)
            db.flush()

            for section_index, section_data in enumerate(course_data["sections"], start=1):
                section = CourseSection(course_id=course.id, title=section_data["title"], position=section_index)
                db.add(section)
                db.flush()

                for lesson_index, lesson_data in enumerate(section_data["lessons"], start=1):
                    video = _get_or_create_video(db, lesson_data["youtube_url"], lesson_data["title"])
                    db.add(
                        Lesson(
                            section_id=section.id,
                            video_id=video.id,
                            title=lesson_data["title"],
                            description=lesson_data["description"],
                            position=lesson_index,
                            duration_minutes=lesson_data["duration_minutes"],
                            is_preview=lesson_data["is_preview"],
                            youtube_url=lesson_data["youtube_url"],
                        )
                    )
            created_courses.append(course)

        db.flush()
        db.add(
            Enrollment(
                user_id=users["student"].id,
                course_id=created_courses[2].id,
                status="active",
                progress_percent=33,
            )
        )
        db.add(
            Review(
                user_id=users["student"].id,
                course_id=created_courses[2].id,
                rating=5,
                comment="AI study panel makes dense lectures much easier to revisit.",
            )
        )
        db.commit()
    finally:
        db.close()


def _get_or_create_user(
    db,
    *,
    name: str,
    email: str,
    role: str,
    avatar_url: str,
    password: str,
) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user:
        if not user.password_hash:
            user.password_hash = hash_password(password)
        return user
    user = User(name=name, email=email, role=role, avatar_url=avatar_url, password_hash=hash_password(password))
    db.add(user)
    return user


def _get_or_create_video(db, youtube_url: str, title: str) -> Video:
    video = db.scalar(select(Video).where(Video.source_url == youtube_url))
    if video:
        return video
    video = Video(
        source_url=youtube_url,
        title=title,
        channel="YouTube",
        duration_seconds=None,
        language="en",
        transcript_status="pending",
    )
    db.add(video)
    db.flush()
    return video


def _thumbnail(video_id: str) -> str:
    return f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
