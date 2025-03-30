-- ==============================================================
-- Script pentru crearea și configurarea bazei de date Supabase
-- pentru aplicația HiperClicker
-- ==============================================================

-- Creăm tabelul pentru profile utilizatori
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  total_views BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Adăugăm un index pentru căutări rapide
  CONSTRAINT unique_user_id UNIQUE (user_id)
);

-- Creăm un trigger pentru actualizarea câmpului updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Creăm tabelul pentru progresul utilizatorilor
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  views NUMERIC DEFAULT 0,
  click_value NUMERIC DEFAULT 1,
  passive_views NUMERIC DEFAULT 0,
  total_clicks BIGINT DEFAULT 0,
  critical_taps BIGINT DEFAULT 0,
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_progress UNIQUE (user_id)
);

-- Adăugăm un trigger pentru actualizarea automată a coloanei updated_at
CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON user_progress
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Creăm tabelul pentru upgrade-urile utilizatorilor
CREATE TABLE IF NOT EXISTS user_upgrades (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  upgrade_id TEXT NOT NULL,
  level INTEGER DEFAULT 0,
  last_upgraded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_upgrade UNIQUE (user_id, upgrade_id)
);

-- ---------------------
-- CONFIGURARE POLITICI
-- ---------------------

-- Activăm RLS (Row Level Security) pe toate tabelele
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_upgrades ENABLE ROW LEVEL SECURITY;

-- Politici pentru profiluri utilizatori
-- Toți utilizatorii pot citi profiluri (pentru leaderboard)
CREATE POLICY "Oricine poate citi profiluri"
  ON user_profiles FOR SELECT
  USING (true);

-- Utilizatorii pot citi, actualiza și șterge doar propriile profile
CREATE POLICY "Utilizatorii pot actualiza propriile profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilizatorii pot crea propriile profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politici pentru progresul utilizatorilor
-- Utilizatorii pot citi doar propriul progres
CREATE POLICY "Utilizatorii pot citi propriul progres"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Utilizatorii pot actualiza doar propriul progres
CREATE POLICY "Utilizatorii pot actualiza propriul progres"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Utilizatorii pot insera doar propriul progres
CREATE POLICY "Utilizatorii pot insera propriul progres"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politici pentru upgrade-urile utilizatorilor
-- Utilizatorii pot citi doar propriile upgrade-uri
CREATE POLICY "Utilizatorii pot citi propriile upgrade-uri"
  ON user_upgrades FOR SELECT
  USING (auth.uid() = user_id);

-- Utilizatorii pot actualiza doar propriile upgrade-uri
CREATE POLICY "Utilizatorii pot actualiza propriile upgrade-uri"
  ON user_upgrades FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Utilizatorii pot insera doar propriile upgrade-uri
CREATE POLICY "Utilizatorii pot insera propriile upgrade-uri"
  ON user_upgrades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------------------
-- FUNCȚII HELPER
-- ---------------------

-- Funcție pentru actualizarea totalului de vizualizări în profilul utilizatorului
CREATE OR REPLACE FUNCTION update_total_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET total_views = NEW.views
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Declanșator pentru actualizarea vizualizărilor totale
CREATE TRIGGER update_total_views_trigger
AFTER INSERT OR UPDATE ON user_progress
FOR EACH ROW
EXECUTE FUNCTION update_total_views();

-- Creăm un index pentru vizualizări totale pentru performanța clasamentului
CREATE INDEX IF NOT EXISTS idx_total_views ON user_profiles (total_views DESC);

-- Funcție pentru obținerea clasamentului global
CREATE OR REPLACE FUNCTION get_global_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  username TEXT,
  total_views BIGINT,
  rank BIGINT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    username,
    total_views,
    ROW_NUMBER() OVER (ORDER BY total_views DESC) as rank
  FROM user_profiles
  ORDER BY total_views DESC
  LIMIT limit_count;
$$; 