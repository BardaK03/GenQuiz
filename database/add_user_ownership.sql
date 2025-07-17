
ALTER TABLE quizzes ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;


ALTER TABLE lessons ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;


ALTER TABLE quiz_results ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;


CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX idx_lessons_user_id ON lessons(user_id);
CREATE INDEX idx_quiz_results_user_id ON quiz_results(user_id);

-- Comentariu: Aceste modificări vor face ca fiecare quiz, lecție și rezultat să fie asociat cu un utilizator specific
-- Utilizatorii vor vedea doar conținutul creat de ei
