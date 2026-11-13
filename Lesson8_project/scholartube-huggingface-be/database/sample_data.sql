-- ScholarTube Edu sample data
-- Demo password for all accounts: Demo@12345
-- Password hash format: pbkdf2_sha256$iterations$salt$digest
--
-- This script resets demo tables before inserting fixed sample IDs.
-- It is intended for a fresh/dev/demo database, not for preserving production data.

BEGIN;

TRUNCATE TABLE
  study_artifacts,
  summaries,
  transcript_chunks,
  lesson_progress,
  reviews,
  enrollments,
  lessons,
  course_sections,
  courses,
  videos,
  users
RESTART IDENTITY CASCADE;

INSERT INTO users (id, name, email, password_hash, role, avatar_url)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'An Nguyen', 'student@scholartube.edu', 'pbkdf2_sha256$240000$c2Nob2xhcnR1YmUtZGVtbw$-QVe1TyLruGcWDPUOTFimu61RZ6gWqnaJ6-5JcSbFeM', 'student', 'https://i.pravatar.cc/120?img=12'),
  ('00000000-0000-4000-8000-000000000002', 'Linh Admin', 'admin@scholartube.edu', 'pbkdf2_sha256$240000$c2Nob2xhcnR1YmUtZGVtbw$-QVe1TyLruGcWDPUOTFimu61RZ6gWqnaJ6-5JcSbFeM', 'admin', 'https://i.pravatar.cc/120?img=32'),
  ('00000000-0000-4000-8000-000000000003', 'Dr. Minh Tran', 'minh.tran@scholartube.edu', 'pbkdf2_sha256$240000$c2Nob2xhcnR1YmUtZGVtbw$-QVe1TyLruGcWDPUOTFimu61RZ6gWqnaJ6-5JcSbFeM', 'instructor', 'https://i.pravatar.cc/120?img=48'),
  ('00000000-0000-4000-8000-000000000004', 'Prof. Mai Le', 'mai.le@scholartube.edu', 'pbkdf2_sha256$240000$c2Nob2xhcnR1YmUtZGVtbw$-QVe1TyLruGcWDPUOTFimu61RZ6gWqnaJ6-5JcSbFeM', 'instructor', 'https://i.pravatar.cc/120?img=47'),
  ('00000000-0000-4000-8000-000000000005', 'Khoa Pham', 'khoa.pham@scholartube.edu', 'pbkdf2_sha256$240000$c2Nob2xhcnR1YmUtZGVtbw$-QVe1TyLruGcWDPUOTFimu61RZ6gWqnaJ6-5JcSbFeM', 'instructor', 'https://i.pravatar.cc/120?img=51')
ON CONFLICT (email) DO NOTHING;

INSERT INTO videos (id, source_url, title, channel, language, transcript_status)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'https://www.youtube.com/watch?v=x7X9w_GIm1s', 'Python in 100 Seconds', 'YouTube', 'en', 'pending'),
  ('10000000-0000-4000-8000-000000000002', 'https://www.youtube.com/watch?v=kqtD5dpn9C8', 'Python for Beginners', 'YouTube', 'en', 'pending'),
  ('10000000-0000-4000-8000-000000000003', 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', 'Python Full Course Overview', 'YouTube', 'en', 'pending'),
  ('10000000-0000-4000-8000-000000000004', 'https://www.youtube.com/watch?v=fNk_zzaMoSs', 'Vectors, what even are they?', 'YouTube', 'en', 'pending'),
  ('10000000-0000-4000-8000-000000000005', 'https://www.youtube.com/watch?v=k7RM-ot2NWY', 'Linear combinations, span, and basis vectors', 'YouTube', 'en', 'pending'),
  ('10000000-0000-4000-8000-000000000006', 'https://www.youtube.com/watch?v=IHZwWFHWa-w', 'Gradient descent, how neural networks learn', 'YouTube', 'en', 'pending'),
  ('10000000-0000-4000-8000-000000000007', 'https://www.youtube.com/watch?v=aircAruvnKk', 'But what is a neural network?', 'YouTube', 'en', 'pending'),
  ('10000000-0000-4000-8000-000000000008', 'https://www.youtube.com/watch?v=Ilg3gGewQ5U', 'What is backpropagation really doing?', 'YouTube', 'en', 'pending'),
  ('10000000-0000-4000-8000-000000000009', 'https://www.youtube.com/watch?v=tIeHLnjs5U8', 'Backpropagation calculus', 'YouTube', 'en', 'pending'),
  ('10000000-0000-4000-8000-000000000010', 'https://www.youtube.com/watch?v=YRhxdVk_sIs', 'Convolutional Neural Networks explained', 'YouTube', 'en', 'pending'),
  ('10000000-0000-4000-8000-000000000011', 'https://www.youtube.com/watch?v=2hXG8v8p0KM', 'Computer Vision basics', 'YouTube', 'en', 'pending'),
  ('10000000-0000-4000-8000-000000000012', 'https://www.youtube.com/watch?v=wjZofJX0v4M', 'Attention in transformers, visually explained', 'YouTube', 'en', 'pending'),
  ('10000000-0000-4000-8000-000000000013', 'https://www.youtube.com/watch?v=ZXiruGOCn9s', 'Transformers explained', 'YouTube', 'en', 'pending')
ON CONFLICT (source_url) DO NOTHING;

INSERT INTO courses (
  id, instructor_id, title, slug, subtitle, description, category, level, language,
  price, rating, rating_count, students_count, duration_minutes, thumbnail_url
)
VALUES
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 'Python Foundations for AI', 'python-foundations-for-ai', 'Nắm Python thực dụng trước khi bước vào data, ML và automation.', 'Khóa học đưa người mới từ cú pháp Python, control flow, functions đến tư duy xử lý dữ liệu cho bài toán AI.', 'Python cơ bản', 'Beginner', 'Vietnamese', 19.99, 4.7, 1324, 18420, 422, 'https://i.ytimg.com/vi/kqtD5dpn9C8/hqdefault.jpg'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000004', 'Mathematics for AI', 'mathematics-for-ai', 'Linear algebra, vector intuition và gradient descent cho người học ML.', 'Khóa học tập trung vào trực giác toán học phía sau mô hình học máy: vector, ma trận, đạo hàm và tối ưu.', 'Toán học cho AI', 'Beginner to Intermediate', 'Vietnamese', 24.99, 4.8, 986, 12980, 41, 'https://i.ytimg.com/vi/fNk_zzaMoSs/hqdefault.jpg'),
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000005', 'Deep Learning Core Concepts', 'deep-learning-core-concepts', 'Hiểu neural network, backpropagation và cách mô hình học.', 'Khóa học đi qua neural networks bằng trực giác, sau đó dùng AI study tools để củng cố bài học bằng summary và flashcards.', 'ML/DL', 'Intermediate', 'Vietnamese', 34.99, 4.9, 2110, 24500, 42, 'https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg'),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000005', 'Computer Vision Primer', 'computer-vision-primer', 'Từ ảnh số đến convolutional neural networks.', 'Lộ trình nhập môn Computer Vision, tập trung vào cách mô hình nhìn ảnh và học đặc trưng.', 'Computer Vision', 'Intermediate', 'Vietnamese', 29.99, 4.6, 742, 8200, 30, 'https://i.ytimg.com/vi/YRhxdVk_sIs/hqdefault.jpg'),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000005', 'NLP and Transformer Essentials', 'nlp-transformer-essentials', 'Từ xử lý ngôn ngữ tự nhiên đến attention và transformers.', 'Khóa học giúp người học hiểu NLP hiện đại và vì sao transformers thay đổi cách xây mô hình ngôn ngữ.', 'NLP', 'Intermediate', 'Vietnamese', 39.99, 4.8, 1598, 17340, 43, 'https://i.ytimg.com/vi/wjZofJX0v4M/hqdefault.jpg')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO course_sections (id, course_id, title, position)
VALUES
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Python nhập môn', 1),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Tư duy code cho AI', 2),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'Linear algebra trực quan', 1),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', 'Optimization', 2),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', 'Neural networks', 1),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000003', 'Training intuition', 2),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000004', 'Image understanding', 1),
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000005', 'Language models', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, section_id, video_id, title, description, position, duration_minutes, is_preview, youtube_url)
VALUES
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Python in 100 Seconds', 'Bức tranh nhanh về Python và vì sao Python phổ biến trong AI.', 1, 2, TRUE, 'https://www.youtube.com/watch?v=x7X9w_GIm1s'),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'Python for Beginners', 'Cú pháp nền tảng, biến, điều kiện, vòng lặp và hàm.', 2, 60, TRUE, 'https://www.youtube.com/watch?v=kqtD5dpn9C8'),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', 'Python Full Course Overview', 'Một bài dài để luyện cấu trúc chương trình và workflow Python.', 1, 360, FALSE, 'https://www.youtube.com/watch?v=_uQrJ0TkZlc'),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000004', 'Vectors, what even are they?', 'Trực giác vector, không gian và biểu diễn dữ liệu.', 1, 10, TRUE, 'https://www.youtube.com/watch?v=fNk_zzaMoSs'),
  ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000005', 'Linear combinations, span, and basis vectors', 'Cách vector kết hợp để tạo không gian biểu diễn.', 2, 9, FALSE, 'https://www.youtube.com/watch?v=k7RM-ot2NWY'),
  ('40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000006', 'Gradient descent, how neural networks learn', 'Cốt lõi của tối ưu trong ML/DL.', 1, 22, FALSE, 'https://www.youtube.com/watch?v=IHZwWFHWa-w'),
  ('40000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000007', 'But what is a neural network?', 'Ý tưởng neuron, layers, weights và learning.', 1, 19, TRUE, 'https://www.youtube.com/watch?v=aircAruvnKk'),
  ('40000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000008', 'What is backpropagation really doing?', 'Giải thích cách tín hiệu lỗi đi ngược qua mạng.', 2, 13, FALSE, 'https://www.youtube.com/watch?v=Ilg3gGewQ5U'),
  ('40000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000009', 'Backpropagation calculus', 'Đạo hàm phía sau backpropagation cho người muốn đào sâu.', 1, 10, FALSE, 'https://www.youtube.com/watch?v=tIeHLnjs5U8'),
  ('40000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000010', 'Convolutional Neural Networks explained', 'Khái niệm convolution, filters và feature maps.', 1, 12, TRUE, 'https://www.youtube.com/watch?v=YRhxdVk_sIs'),
  ('40000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000011', 'Computer Vision basics', 'Tổng quan pipeline thị giác máy tính hiện đại.', 2, 18, FALSE, 'https://www.youtube.com/watch?v=2hXG8v8p0KM'),
  ('40000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000012', 'Attention in transformers, visually explained', 'Cách attention giúp mô hình chọn thông tin quan trọng trong chuỗi.', 1, 27, TRUE, 'https://www.youtube.com/watch?v=wjZofJX0v4M'),
  ('40000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000013', 'Transformers explained', 'Tổng quan kiến trúc transformer và ứng dụng trong NLP.', 2, 16, FALSE, 'https://www.youtube.com/watch?v=ZXiruGOCn9s')
ON CONFLICT (id) DO NOTHING;

INSERT INTO enrollments (id, user_id, course_id, status, progress_percent)
VALUES
  ('50000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'active', 33.33)
ON CONFLICT (user_id, course_id) DO NOTHING;

INSERT INTO reviews (id, user_id, course_id, rating, comment)
VALUES
  ('60000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 5, 'AI study panel makes dense lectures much easier to revisit.')
ON CONFLICT (user_id, course_id) DO NOTHING;

COMMIT;
