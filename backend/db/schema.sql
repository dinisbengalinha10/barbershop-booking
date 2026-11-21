CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE barbers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  duration_min INT NOT NULL CHECK (duration_min > 0),
  price_cents INT NOT NULL CHECK (price_cents >= 0)
);

CREATE TABLE working_hours (
  id SERIAL PRIMARY KEY,
  barber_id INT NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  weekday INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL CHECK (end_time > start_time)
);

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  barber_id INT NOT NULL REFERENCES barbers(id),
  service_id INT NOT NULL REFERENCES services(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  -- impede marcações sobrepostas para o mesmo barbeiro
  EXCLUDE USING gist (
    barber_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (status = 'confirmed')
);

INSERT INTO barbers (name) VALUES ('João'), ('Miguel');
INSERT INTO services (name, duration_min, price_cents) VALUES
  ('Corte', 30, 1200),
  ('Barba', 20, 800),
  ('Corte + Barba', 45, 1800);