import pool from './database';

export interface Quiz {
  id: number;
  subject: string;
  type: 'multiple-choice' | 'short-answer';
  questions: any[];
  created_at: Date;
  updated_at: Date;
}

export interface Lesson {
  id: number;
  subject: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

// Quiz functions
export async function saveQuiz(subject: string, type: string, questions: any[]): Promise<Quiz> {
  const query = `
    INSERT INTO quizzes (subject, type, questions, updated_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    RETURNING *
  `;
  
  const result = await pool.query(query, [subject, type, JSON.stringify(questions)]);
  return result.rows[0];
}

export async function getAllQuizzes(): Promise<Quiz[]> {
  const query = 'SELECT * FROM quizzes ORDER BY created_at DESC';
  const result = await pool.query(query);
  return result.rows;
}

export async function getQuizById(id: number): Promise<Quiz | null> {
  const query = 'SELECT * FROM quizzes WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function getQuizzesBySubject(subject: string): Promise<Quiz[]> {
  const query = 'SELECT * FROM quizzes WHERE subject = $1 ORDER BY created_at DESC';
  const result = await pool.query(query, [subject]);
  return result.rows;
}

// Lesson functions
export async function saveLesson(subject: string, content: string): Promise<Lesson> {
  const query = `
    INSERT INTO lessons (subject, content, updated_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    RETURNING *
  `;
  
  const result = await pool.query(query, [subject, content]);
  return result.rows[0];
}

export async function getAllLessons(): Promise<Lesson[]> {
  const query = 'SELECT * FROM lessons ORDER BY created_at DESC';
  const result = await pool.query(query);
  return result.rows;
}

export async function getLessonById(id: number): Promise<Lesson | null> {
  const query = 'SELECT * FROM lessons WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function getLessonsBySubject(subject: string): Promise<Lesson[]> {
  const query = 'SELECT * FROM lessons WHERE subject = $1 ORDER BY created_at DESC';
  const result = await pool.query(query, [subject]);
  return result.rows;
}

// New functions for lesson management
export async function updateLesson(id: number, subject: string, content: string): Promise<Lesson | null> {
  const query = `
    UPDATE lessons 
    SET subject = $1, content = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  
  const result = await pool.query(query, [subject, content, id]);
  return result.rows[0] || null;
}

export async function deleteLesson(id: number): Promise<boolean> {
  const query = 'DELETE FROM lessons WHERE id = $1';
  const result = await pool.query(query, [id]);
  return (result.rowCount || 0) > 0;
}
