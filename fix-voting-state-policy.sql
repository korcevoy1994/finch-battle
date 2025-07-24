-- Исправление политики безопасности для voting_state
-- Эта политика разрешает анонимным пользователям обновлять состояние голосования

-- Удаляем старые политики для voting_state
DROP POLICY IF EXISTS "Allow authenticated update on voting_state" ON voting_state;
DROP POLICY IF EXISTS "Allow authenticated insert on voting_state" ON voting_state;

-- Создаем новые политики, которые разрешают анонимным пользователям обновлять состояние
CREATE POLICY "Allow public update on voting_state" ON voting_state
  FOR UPDATE USING (true);

CREATE POLICY "Allow public insert on voting_state" ON voting_state
  FOR INSERT WITH CHECK (true);

-- Также добавляем политику для удаления голосов анонимными пользователями (для функции сброса)
DROP POLICY IF EXISTS "Allow authenticated delete on votes" ON votes;
CREATE POLICY "Allow public delete on votes" ON votes
  FOR DELETE USING (true);