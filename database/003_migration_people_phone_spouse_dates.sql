ALTER TABLE people
    ADD COLUMN phone_number text,
    ADD COLUMN spouse_birthday date,
    ADD COLUMN spouse_deathday date,
    ADD CONSTRAINT people_spouse_deathday_requires_birthday_check
        CHECK (spouse_deathday IS NULL OR spouse_birthday IS NOT NULL);
