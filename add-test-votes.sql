-- Добавление тестовых голосов для всех DJ с разными значениями
-- Очистка существующих голосов для раунда 1
DELETE FROM votes WHERE round = 1;

-- Добавление голосов для DJ Maxim (ID 1) - 15 голосов
INSERT INTO votes (dj_id, fingerprint, round) VALUES 
(1, 'test_fingerprint_1_1', 1),
(1, 'test_fingerprint_1_2', 1),
(1, 'test_fingerprint_1_3', 1),
(1, 'test_fingerprint_1_4', 1),
(1, 'test_fingerprint_1_5', 1),
(1, 'test_fingerprint_1_6', 1),
(1, 'test_fingerprint_1_7', 1),
(1, 'test_fingerprint_1_8', 1),
(1, 'test_fingerprint_1_9', 1),
(1, 'test_fingerprint_1_10', 1),
(1, 'test_fingerprint_1_11', 1),
(1, 'test_fingerprint_1_12', 1),
(1, 'test_fingerprint_1_13', 1),
(1, 'test_fingerprint_1_14', 1),
(1, 'test_fingerprint_1_15', 1);

-- Добавление голосов для DJ Anna (ID 2) - 8 голосов
INSERT INTO votes (dj_id, fingerprint, round) VALUES 
(2, 'test_fingerprint_2_1', 1),
(2, 'test_fingerprint_2_2', 1),
(2, 'test_fingerprint_2_3', 1),
(2, 'test_fingerprint_2_4', 1),
(2, 'test_fingerprint_2_5', 1),
(2, 'test_fingerprint_2_6', 1),
(2, 'test_fingerprint_2_7', 1),
(2, 'test_fingerprint_2_8', 1);

-- Добавление голосов для DJ Alex (ID 3) - 12 голосов
INSERT INTO votes (dj_id, fingerprint, round) VALUES 
(3, 'test_fingerprint_3_1', 1),
(3, 'test_fingerprint_3_2', 1),
(3, 'test_fingerprint_3_3', 1),
(3, 'test_fingerprint_3_4', 1),
(3, 'test_fingerprint_3_5', 1),
(3, 'test_fingerprint_3_6', 1),
(3, 'test_fingerprint_3_7', 1),
(3, 'test_fingerprint_3_8', 1),
(3, 'test_fingerprint_3_9', 1),
(3, 'test_fingerprint_3_10', 1),
(3, 'test_fingerprint_3_11', 1),
(3, 'test_fingerprint_3_12', 1);

-- Добавление голосов для DJ Maria (ID 4) - 5 голосов
INSERT INTO votes (dj_id, fingerprint, round) VALUES 
(4, 'test_fingerprint_4_1', 1),
(4, 'test_fingerprint_4_2', 1),
(4, 'test_fingerprint_4_3', 1),
(4, 'test_fingerprint_4_4', 1),
(4, 'test_fingerprint_4_5', 1);

-- Проверка результатов
SELECT 
    d.name,
    COUNT(v.id) as vote_count
FROM djs d
LEFT JOIN votes v ON d.id = v.dj_id AND v.round = 1
GROUP BY d.id, d.name
ORDER BY vote_count DESC;