-- Создание таблицы DJ
CREATE TABLE IF NOT EXISTS djs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы голосов
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  fingerprint VARCHAR(255) NOT NULL,
  round INTEGER NOT NULL CHECK (round IN (1, 2)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fingerprint, round)
);

-- Создание таблицы состояния голосования
CREATE TABLE IF NOT EXISTS voting_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  round_1_active BOOLEAN DEFAULT FALSE,
  round_2_active BOOLEAN DEFAULT FALSE,
  round_1_finalists INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Вставка начального состояния
INSERT INTO voting_state (id, round_1_active, round_2_active) 
VALUES (1, FALSE, FALSE) 
ON CONFLICT (id) DO NOTHING;

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_votes_dj_id ON votes(dj_id);
CREATE INDEX IF NOT EXISTS idx_votes_round ON votes(round);
CREATE INDEX IF NOT EXISTS idx_votes_fingerprint ON votes(fingerprint);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);

-- Включение Row Level Security (RLS)
ALTER TABLE djs ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_state ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для публичного чтения
CREATE POLICY "Allow public read access on djs" ON djs
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on votes" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on voting_state" ON voting_state
  FOR SELECT USING (true);

-- Политики для вставки голосов (только INSERT)
CREATE POLICY "Allow public insert on votes" ON votes
  FOR INSERT WITH CHECK (true);

-- Политики для обновления состояния голосования (только для аутентифицированных пользователей)
CREATE POLICY "Allow authenticated update on voting_state" ON voting_state
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on voting_state" ON voting_state
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Политики для управления DJ (только для аутентифицированных пользователей)
CREATE POLICY "Allow authenticated insert on djs" ON djs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on djs" ON djs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on djs" ON djs
  FOR DELETE USING (auth.role() = 'authenticated');

-- Политики для удаления голосов (только для аутентифицированных пользователей)
CREATE POLICY "Allow authenticated delete on votes" ON votes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Вставка примеров DJ для тестирования
INSERT INTO djs (name, description) VALUES 
('DJ Maxim', 'Maestru al muzicii electronice'),
('DJ Anna', 'Regina muzicii house'),
('DJ Alex', 'Virtuoz techno'),
('DJ Maria', 'Guru progressive house')
ON CONFLICT DO NOTHING;

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at в voting_state
CREATE TRIGGER update_voting_state_updated_at 
    BEFORE UPDATE ON voting_state 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Включение Realtime для всех таблиц
ALTER PUBLICATION supabase_realtime ADD TABLE djs;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
ALTER PUBLICATION supabase_realtime ADD TABLE voting_state;