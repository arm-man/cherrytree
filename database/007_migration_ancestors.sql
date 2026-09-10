CREATE TABLE ancestors (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    birthday date NOT NULL,
    deathday date,
    spouse text
);
