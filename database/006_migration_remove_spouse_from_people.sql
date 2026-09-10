-- Clean up people table
ALTER TABLE people
    DROP CONSTRAINT people_spouse_deathday_requires_birthday_check,
    DROP COLUMN spouse,
    DROP COLUMN spouse_birthday,
    DROP COLUMN spouse_deathday;