-- A partner is display/relationship data associated with a person in the
-- people table. Multiple partner rows may reference the same person.
CREATE TABLE partners (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    partner_id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    birthday date,
    deathday date,
    created_at timestamptz NOT NULL DEFAULT NOW(),

    CONSTRAINT partners_partner_id_fkey
        FOREIGN KEY (partner_id)
        REFERENCES people(id)
        ON DELETE CASCADE,

    CONSTRAINT partners_deathday_requires_birthday_check
        CHECK (deathday IS NULL OR birthday IS NOT NULL)
);

-- Preserve existing spouse names. Legacy values separated by semicolons are
-- converted into separate partner rows.
--
-- The final whitespace-separated word is treated as last_name and everything
-- before it as first_name.
--
-- Birthday/deathday values are copied only when the legacy spouse field
-- contains a single partner.
INSERT INTO partners (
    partner_id,
    first_name,
    last_name
)
SELECT
    p.id,

    CASE
        WHEN btrim(s.partner_name) LIKE '% %'
            THEN regexp_replace(
                btrim(s.partner_name),
                '\s+\S+$',
                ''
            )
        ELSE btrim(s.partner_name)
    END AS first_name,

    CASE
        WHEN btrim(s.partner_name) LIKE '% %'
            THEN regexp_replace(
                btrim(s.partner_name),
                '^.*\s+',
                ''
            )
        ELSE ''
    END AS last_name

FROM people AS p
CROSS JOIN LATERAL
    regexp_split_to_table(p.spouse, '\s*;\s*') AS s(partner_name)

WHERE p.spouse IS NOT NULL
  AND btrim(p.spouse) <> ''
  AND btrim(s.partner_name) <> '';

