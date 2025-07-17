import pool from "./database";

export interface Quiz {
  id: number;
  subject: string;
  type: "multiple-choice" | "short-answer";
  questions: any[];
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface Lesson {
  id: number;
  subject: string;
  content: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

// User functions
export async function createUser(
  firstName: string,
  lastName: string,
  email: string,
  hashedPassword: string
): Promise<User> {
  const query = `
    INSERT INTO users (first_name, last_name, email, password)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  
  const result = await pool.query(query, [firstName, lastName, email, hashedPassword]);
  return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

export async function getUserById(id: number): Promise<User | null> {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

// Quiz functions
export async function saveQuiz(
  subject: string,
  type: string,
  questions: any[],
  userId: number
): Promise<Quiz> {
  const query = `
    INSERT INTO quizzes (subject, type, questions, user_id, updated_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    RETURNING *
  `;

  const result = await pool.query(query, [
    subject,
    type,
    JSON.stringify(questions),
    userId,
  ]);
  return result.rows[0];
}

export async function getAllQuizzes(): Promise<Quiz[]> {
  const query = "SELECT * FROM quizzes ORDER BY created_at DESC";
  const result = await pool.query(query);
  return result.rows;
}

export async function getQuizzesByUserId(userId: number): Promise<Quiz[]> {
  const query = "SELECT * FROM quizzes WHERE user_id = $1 ORDER BY created_at DESC";
  const result = await pool.query(query, [userId]);
  return result.rows;
}

export async function getQuizById(id: number): Promise<Quiz | null> {
  const query = "SELECT * FROM quizzes WHERE id = $1";
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function getQuizByIdAndUserId(id: number, userId: number): Promise<Quiz | null> {
  const query = "SELECT * FROM quizzes WHERE id = $1 AND user_id = $2";
  const result = await pool.query(query, [id, userId]);
  return result.rows[0] || null;
}

export async function getQuizzesBySubject(subject: string): Promise<Quiz[]> {
  const query =
    "SELECT * FROM quizzes WHERE subject = $1 ORDER BY created_at DESC";
  const result = await pool.query(query, [subject]);
  return result.rows;
}

export async function getQuizzesBySubjectAndUserId(subject: string, userId: number): Promise<Quiz[]> {
  const query =
    "SELECT * FROM quizzes WHERE subject = $1 AND user_id = $2 ORDER BY created_at DESC";
  const result = await pool.query(query, [subject, userId]);
  return result.rows;
}

// Lesson functions
export async function saveLesson(
  subject: string,
  content: string,
  userId: number
): Promise<Lesson> {
  const query = `
    INSERT INTO lessons (subject, content, user_id, updated_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    RETURNING *
  `;

  const result = await pool.query(query, [subject, content, userId]);
  return result.rows[0];
}

export async function getAllLessons(): Promise<Lesson[]> {
  const query = "SELECT * FROM lessons ORDER BY created_at DESC";
  const result = await pool.query(query);
  return result.rows;
}

export async function getLessonsByUserId(userId: number): Promise<Lesson[]> {
  const query = "SELECT * FROM lessons WHERE user_id = $1 ORDER BY created_at DESC";
  const result = await pool.query(query, [userId]);
  return result.rows;
}

export async function getLessonById(id: number): Promise<Lesson | null> {
  const query = "SELECT * FROM lessons WHERE id = $1";
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function getLessonByIdAndUserId(id: number, userId: number): Promise<Lesson | null> {
  const query = "SELECT * FROM lessons WHERE id = $1 AND user_id = $2";
  const result = await pool.query(query, [id, userId]);
  return result.rows[0] || null;
}

export async function getLessonsBySubject(subject: string): Promise<Lesson[]> {
  const query =
    "SELECT * FROM lessons WHERE subject = $1 ORDER BY created_at DESC";
  const result = await pool.query(query, [subject]);
  return result.rows;
}

export async function getLessonsBySubjectAndUserId(subject: string, userId: number): Promise<Lesson[]> {
  const query =
    "SELECT * FROM lessons WHERE subject = $1 AND user_id = $2 ORDER BY created_at DESC";
  const result = await pool.query(query, [subject, userId]);
  return result.rows;
}

// New functions for lesson management
export async function updateLesson(
  id: number,
  subject: string,
  content: string,
  userId: number
): Promise<Lesson | null> {
  const query = `
    UPDATE lessons 
    SET subject = $1, content = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3 AND user_id = $4
    RETURNING *
  `;

  const result = await pool.query(query, [subject, content, id, userId]);
  return result.rows[0] || null;
}

export async function deleteLesson(id: number, userId: number): Promise<boolean> {
  const query = "DELETE FROM lessons WHERE id = $1 AND user_id = $2";
  const result = await pool.query(query, [id, userId]);
  return (result.rowCount || 0) > 0;
}

// Quiz management functions
export async function updateQuiz(
  id: number,
  subject: string,
  type: string,
  questions: any[],
  userId: number
): Promise<Quiz | null> {
  const query = `
    UPDATE quizzes 
    SET subject = $1, type = $2, questions = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $4 AND user_id = $5
    RETURNING *
  `;

  const result = await pool.query(query, [
    subject,
    type,
    JSON.stringify(questions),
    id,
    userId,
  ]);
  return result.rows[0] || null;
}

export async function deleteQuiz(id: number, userId: number): Promise<boolean> {
  const query = "DELETE FROM quizzes WHERE id = $1 AND user_id = $2";
  const result = await pool.query(query, [id, userId]);
  return (result.rowCount || 0) > 0;
}
