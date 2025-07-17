-- Script pentru setarea unui utilizator ca administrator
-- Rulează acest script în pgAdmin după ce ai aplicat create_rag_documents.sql

-- Înlocuiește 'admin@example.com' cu email-ul utilizatorului care trebuie să fie admin
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@example.com';

-- Verifică dacă utilizatorul a fost setat ca admin
SELECT id, first_name, last_name, email, is_admin 
FROM users 
WHERE is_admin = true;
