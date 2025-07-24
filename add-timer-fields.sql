-- Добавление полей для timestamp начала голосования
-- Эти поля позволят таймеру синхронизироваться с реальным временем начала голосования

ALTER TABLE voting_state 
ADD COLUMN round_1_started_at TIMESTAMPTZ,
ADD COLUMN round_2_started_at TIMESTAMPTZ;

-- Комментарии для полей
COMMENT ON COLUMN voting_state.round_1_started_at IS 'Время начала голосования в первом раунде';
COMMENT ON COLUMN voting_state.round_2_started_at IS 'Время начала голосования во втором раунде';