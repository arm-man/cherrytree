CREATE TABLE people (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    parent_id integer,
    first_name text NOT NULL,
    last_name text NOT NULL,
    birthday date NOT NULL,
    deathday date,
    spouse text,
    created_at timestamptz NOT NULL DEFAULT NOW(),

    CONSTRAINT people_parent_id_fkey
        FOREIGN KEY (parent_id)
        REFERENCES people(id)
        ON DELETE NO ACTION
);

CREATE TABLE logs (
    severity text NOT NULL DEFAULT 'error',
    message text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
