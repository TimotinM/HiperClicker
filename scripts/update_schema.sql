-- Script pentru actualizarea schemei bazei de date
-- Adăugăm coloana updated_at la tabelul user_progress dacă nu există deja
-- și modificăm tipurile coloanelor click_value și passive_views pentru a accepta valori cu zecimale

DO $$
BEGIN
    -- Verificăm dacă coloana updated_at există deja în tabelul user_progress
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_progress' AND column_name = 'updated_at'
    ) THEN
        -- Adăugăm coloana updated_at
        ALTER TABLE user_progress ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Actualizăm valorile existente
        UPDATE user_progress SET updated_at = last_synced;
        
        -- Creăm un trigger pentru actualizarea automată a coloanei updated_at
        CREATE TRIGGER update_user_progress_updated_at
        BEFORE UPDATE ON user_progress
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
        
        RAISE NOTICE 'Coloana updated_at a fost adăugată la tabelul user_progress';
    ELSE
        RAISE NOTICE 'Coloana updated_at există deja în tabelul user_progress';
    END IF;
    
    -- Verificăm dacă coloana click_value este de tip numeric
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_progress' AND column_name = 'click_value' AND data_type = 'bigint'
    ) THEN
        -- Modificăm tipul coloanei click_value în NUMERIC pentru a accepta valori zecimale
        ALTER TABLE user_progress ALTER COLUMN click_value TYPE NUMERIC;
        RAISE NOTICE 'Coloana click_value a fost modificată pentru a accepta valori zecimale';
    ELSE
        RAISE NOTICE 'Coloana click_value are deja tipul NUMERIC';
    END IF;
    
    -- Verificăm dacă coloana passive_views este de tip numeric
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_progress' AND column_name = 'passive_views' AND data_type = 'bigint'
    ) THEN
        -- Modificăm tipul coloanei passive_views în NUMERIC pentru a accepta valori zecimale
        ALTER TABLE user_progress ALTER COLUMN passive_views TYPE NUMERIC;
        RAISE NOTICE 'Coloana passive_views a fost modificată pentru a accepta valori zecimale';
    ELSE
        RAISE NOTICE 'Coloana passive_views are deja tipul NUMERIC';
    END IF;
    
    -- Verificăm dacă coloana views este de tip numeric
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_progress' AND column_name = 'views' AND data_type = 'bigint'
    ) THEN
        -- Modificăm tipul coloanei views în NUMERIC pentru a accepta valori zecimale
        ALTER TABLE user_progress ALTER COLUMN views TYPE NUMERIC;
        RAISE NOTICE 'Coloana views a fost modificată pentru a accepta valori zecimale';
    ELSE
        RAISE NOTICE 'Coloana views are deja tipul NUMERIC';
    END IF;
END $$;

-- Verificăm dacă tabelul user_boosters există deja
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_boosters') THEN
        -- Creăm tabelul pentru boosterele utilizatorilor
        CREATE TABLE public.user_boosters (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            booster_type VARCHAR(50) NOT NULL,
            count INTEGER NOT NULL DEFAULT 0,
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            -- Cheia unică pentru user_id și booster_type
            CONSTRAINT user_boosters_user_id_booster_type_key UNIQUE (user_id, booster_type)
        );
        
        -- Comentarii pentru tabel și coloane
        COMMENT ON TABLE public.user_boosters IS 'Boosterele deținute de utilizatori';
        COMMENT ON COLUMN public.user_boosters.user_id IS 'ID-ul utilizatorului';
        COMMENT ON COLUMN public.user_boosters.booster_type IS 'Tipul de booster';
        COMMENT ON COLUMN public.user_boosters.count IS 'Numărul de boostere de acest tip deținute de utilizator';
        COMMENT ON COLUMN public.user_boosters.last_updated IS 'Data ultimei actualizări';
        
        -- Adăugăm permisiuni RLS
        ALTER TABLE public.user_boosters ENABLE ROW LEVEL SECURITY;
        
        -- Politica pentru citire: utilizatorii pot citi doar propriile boostere
        CREATE POLICY "Users can view their own boosters" 
        ON public.user_boosters
        FOR SELECT USING (auth.uid() = user_id);
        
        -- Politica pentru inserare: utilizatorii pot insera doar propriile boostere
        CREATE POLICY "Users can insert their own boosters" 
        ON public.user_boosters
        FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        -- Politica pentru actualizare: utilizatorii pot actualiza doar propriile boostere
        CREATE POLICY "Users can update their own boosters" 
        ON public.user_boosters
        FOR UPDATE USING (auth.uid() = user_id);
        
        -- Indexuri pentru performanță
        CREATE INDEX idx_user_boosters_user_id ON public.user_boosters(user_id);
        CREATE INDEX idx_user_boosters_booster_type ON public.user_boosters(booster_type);
    ELSE
        RAISE NOTICE 'Tabelul user_boosters există deja';
    END IF;
END $$; 