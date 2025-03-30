# Configurarea Supabase pentru HiperClicker

Acest document explică cum să configurezi Supabase pentru a funcționa cu aplicația HiperClicker, implementând Backend-ul pentru Faza 2 a proiectului.

## 1. Crearea proiectului Supabase

1. Creează un cont pe [Supabase](https://supabase.com/) dacă nu ai deja unul.
2. Creează un proiect nou.
3. Notează-ți URL-ul proiectului și cheia anonimă (anon key).

## 2. Configurarea aplicației

1. Deschide fișierul `HiperClicker/config/settings.ts`.
2. Actualizează următoarele constante cu valorile tale:

```javascript
export const SUPABASE_URL = 'https://your-supabase-project-id.supabase.co';
export const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
```

## 3. Configurarea bazei de date

### Structura bazei de date

Aplicația HiperClicker folosește următoarele tabele:

1. **user_profiles**: Stochează informații despre utilizatori
   - `id`: ID unic (serial)
   - `user_id`: ID-ul utilizatorului din Supabase Auth
   - `username`: Numele de utilizator
   - `total_views`: Numărul total de vizualizări
   - `created_at`: Data creării
   - `updated_at`: Data ultimei actualizări

2. **user_progress**: Stochează progresul utilizatorilor
   - `id`: ID unic (serial)
   - `user_id`: ID-ul utilizatorului din Supabase Auth
   - `views`: Numărul de vizualizări
   - `click_value`: Valoarea unui click
   - `passive_views`: Vizualizări pasive pe secundă
   - `total_clicks`: Numărul total de clickuri
   - `critical_taps`: Numărul de tapuri critice
   - `last_synced`: Data ultimei sincronizări

3. **user_upgrades**: Stochează upgrade-urile utilizatorilor
   - `id`: ID unic (serial)
   - `user_id`: ID-ul utilizatorului din Supabase Auth
   - `upgrade_id`: ID-ul upgrade-ului
   - `level`: Nivelul upgrade-ului
   - `last_upgraded`: Data ultimei actualizări

### Configurarea automată

Poți utiliza scriptul SQL furnizat pentru a configura automat baza de date:

1. Navighează la secțiunea SQL din dashboard-ul Supabase.
2. Copiază conținutul fișierului `HiperClicker/scripts/setup_supabase.sql`.
3. Lipește-l în editorul SQL din Supabase și execută-l.

### Configurarea manuală

Alternativ, poți configura manual tabelele:

1. Creează tabelele `user_profiles`, `user_progress` și `user_upgrades` cu structura descrisă mai sus.
2. Activează Row Level Security (RLS) pentru toate tabelele.
3. Configurează politicile de securitate pentru a permite utilizatorilor să:
   - Citească toate profilurile (pentru clasament)
   - Modifice doar propriile date
   - Insereze doar propriile date

## 4. Autentificarea

Aplicația HiperClicker folosește autentificarea anonimă din Supabase:

1. În dashboard-ul Supabase, navighează la Authentication > Settings.
2. Asigură-te că Email Auth este activat.
3. În secțiunea "Email Auth", setează:
   - "Enable Email Confirmations" la "Disable" (pentru autentificarea anonimă).
   - "Secure Email Change" la "Disable" (opțional).
   
### Formatul email-urilor pentru autentificare anonimă

Aplicația folosește email-uri generate automat pentru utilizatorii anonimi cu formatul:
```
user{deviceId}@hiperclicker.com
```

Unde `{deviceId}` este o parte din ID-ul unic al dispozitivului. 

### Configurare suplimentară (dacă apar probleme)

Dacă întâmpini probleme cu validarea email-urilor:

1. Verifică în dashboard-ul Supabase la Authentication > Email Templates > "Email Validation" dacă validarea este prea strictă.
2. Poți adăuga domeniul `hiperclicker.com` în lista de domenii permise, dacă există o astfel de opțiune.
3. Alternativ, poți modifica formatul email-ului în fișierul `app/hooks/useAuth.ts` pentru a utiliza un alt domeniu valid.

## 5. Testarea

Pentru a testa conexiunea cu Supabase:

1. Pornește aplicația în modul de dezvoltare: `npm run start`.
2. Creează un cont anonim (prin ecranul de autentificare).
3. Verifică în dashboard-ul Supabase, în secțiunea Authentication > Users, dacă utilizatorul a fost creat.
4. Verifică tabelul `user_profiles` pentru a vedea dacă s-a creat un profil pentru utilizator.

## 6. Funcționalități implementate

Cu Supabase configurat corect, aplicația HiperClicker va avea următoarele funcționalități:

1. **Autentificare**: Utilizatorii pot crea conturi anonime sau pot juca offline.
2. **Sincronizare progres**: Progresul jocului este sincronizat automat cu Supabase.
3. **Clasament global**: Utilizatorii pot vedea un clasament global bazat pe numărul de vizualizări.
4. **Persistență**: Datele utilizatorilor sunt păstrate între sesiuni.

### Cum funcționează sincronizarea

Aplicația HiperClicker folosește următorul sistem de sincronizare:

1. **Salvare locală constantă**: Fiecare tap și acțiune salvează progresul local pe dispozitiv.
2. **Sincronizare periodică**: Datele sunt sincronizate cu Supabase la fiecare 5 minute, dacă utilizatorul este online.
3. **Sincronizare la momente cheie**: 
   - La cumpărarea unui upgrade
   - La resetarea jocului
   - La pornirea aplicației
   - La schimbarea ecranului spre leaderboard
4. **Sincronizare manuală**: Utilizatorul poate sincroniza manual oricând apăsând butonul "SINCRONIZEAZĂ" din interfață.

Acest sistem asigură o experiență optimă pentru utilizator, reducând traficul de date și economisind bateria dispozitivului, menținând în același timp progresul actualizat în cloud.

## 7. Actualizarea schemei bazei de date

Dacă întâmpini erori legate de coloanele din baza de date, este posibil să fie necesară actualizarea schemei.

### Rezolvarea erorii "Could not find the 'updated_at' column of 'user_progress'"

1. Navighează la secțiunea SQL din dashboard-ul Supabase.
2. Execută scriptul din fișierul `HiperClicker/scripts/update_schema.sql`.
3. Acest script va adăuga coloana lipsă `updated_at` și va configura triggere pentru actualizarea automată a acesteia.

### Rezolvarea erorii "invalid input syntax for type bigint: \"X.Y\""

Această eroare apare când aplicația încearcă să salveze valori cu zecimale (de exemplu, 61.5) într-o coloană de tip BIGINT din baza de date, care acceptă doar valori întregi.

Scriptul `update_schema.sql` include și modificări pentru a schimba tipul coloanelor `views`, `click_value` și `passive_views` din BIGINT în NUMERIC, permițând astfel stocarea valorilor cu zecimale.

După rularea scriptului, erorile legate de tipul de date ar trebui să fie rezolvate. Dacă continui să întâmpini probleme:

1. Verifică în dashboard-ul Supabase tipurile coloanelor în tabelul `user_progress`.
2. Asigură-te că coloanele `views`, `click_value` și `passive_views` sunt de tip NUMERIC.
3. Dacă nu sunt, execută manual următoarele comenzi SQL:
   ```sql
   ALTER TABLE user_progress ALTER COLUMN views TYPE NUMERIC;
   ALTER TABLE user_progress ALTER COLUMN click_value TYPE NUMERIC;
   ALTER TABLE user_progress ALTER COLUMN passive_views TYPE NUMERIC;
   ```

## 8. Depanare

Dacă întâmpini probleme:

1. Verifică valorile `SUPABASE_URL` și `SUPABASE_ANON_KEY` în `settings.ts`.
2. Asigură-te că tabelele și politicile RLS sunt configurate corect.
3. Verifică dacă autentificarea prin email este activată în Supabase.
4. Verifică log-urile din consola aplicației pentru mesaje de eroare.
5. Asigură-te că schema bazei de date este actualizată folosind scriptul `update_schema.sql`.
6. Verifică tipurile de date din coloanele bazei tale de date (în special pentru coloanele `views`, `click_value` și `passive_views`).

## 9. Structura completă a bazei de date

Pentru referință, iată structura completă a tabelelor după actualizări:

### Tabelul `user_profiles`
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  total_views BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_id UNIQUE (user_id)
);
```

### Tabelul `user_progress`
```sql
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
```

### Tabelul `user_upgrades`
```sql
CREATE TABLE IF NOT EXISTS user_upgrades (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  upgrade_id TEXT NOT NULL,
  level INTEGER DEFAULT 0,
  last_upgraded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_upgrade UNIQUE (user_id, upgrade_id)
);
``` 