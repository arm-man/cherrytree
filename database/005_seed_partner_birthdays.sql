-- Update partners.birthday from the legacy Cherry Tree birthday data supplied by the user.
--
-- Matching policy:
--   * Target partners are matched using the requested first_name + last_name split:
--       last_name  = last word of the original partner Full Name
--       first_name = everything before the last word
--   * Legacy birthday-source names may contain middle names, maiden names, formal
--     first names, nicknames, or prefixes. Source matches are documented below.
--   * Brooke Bullard is intentionally NOT updated because the supplied source has
--     two plausible people:
--         Brooke Elizabeth English Bullard  1981-04-23
--         Brooke Beitzel Bullard             1997-05-22
--     and the partners table contains two rows named Brooke Bullard. first_name +
--     last_name alone cannot safely distinguish which birthday belongs to which row.
--
-- Safety behavior:
--   * Every intended update must match at least one partners row.
--   * If an intended name matches ZERO rows, PostgreSQL raises an exception.
--   * Because everything runs inside one transaction, that exception rolls back
--     ALL birthday updates from this script.
--
-- Note: this permits multiple partner rows with the same first_name/last_name to
-- be updated. Brooke Bullard is excluded specifically because two different
-- birthdays must be assigned to two indistinguishable name keys.

BEGIN;

DO $$
DECLARE
    r record;
    updated_count integer;
BEGIN
    FOR r IN
        SELECT *
        FROM (
            VALUES
                ('Aaron'::text, 'Easter'::text, DATE '1982-08-22', 'Aaron Easter'::text, 'Aaron Easter'::text),
                ('Alex'::text, 'Hendrickson'::text, DATE '1985-02-20', 'Alex Hendrickson'::text, 'Alexandra Maria Chiu Hendrickson'::text),
                ('Andrew'::text, 'Champ'::text, DATE '1994-05-31', 'Andrew Champ'::text, 'Andrew Champ'::text),
                ('Andrew'::text, 'Smith'::text, DATE '1987-05-07', 'Andrew Smith'::text, 'Andrew Blake Smith'::text),
                ('Anne'::text, 'Burleson'::text, DATE '1987-10-08', 'Anne Burleson'::text, 'Anne Elizabeth Karns Burleson'::text),
                ('Austin'::text, 'Fogt'::text, DATE '1991-09-07', 'Austin Fogt'::text, 'Austin Fogt'::text),
                ('Becky'::text, 'Bullard'::text, DATE '1973-08-29', 'Becky Bullard'::text, 'Rebecca Elizabeth Brenner Bullard'::text),
                ('Ben'::text, 'Pope'::text, DATE '1988-07-15', 'Ben Pope'::text, 'Benjamin Pope'::text),
                ('Billy'::text, 'Etbauer'::text, DATE '1963-01-15', 'Billy Etbauer'::text, 'Billy Joe Etbauer'::text),
                ('Billy Ray'::text, 'Couts'::text, DATE '1956-09-27', 'Billy Ray Couts'::text, 'Billy Ray Couts'::text),
                ('Braden'::text, 'Canino'::text, DATE '1997-02-04', 'Braden Canino'::text, 'Braden Justus Canino'::text),
                ('Briana'::text, 'Bullard'::text, DATE '1995-06-18', 'Briana Bullard'::text, 'Briana Bullard'::text),
                ('Chapman'::text, 'Pennington'::text, DATE '2000-04-20', 'Chapman Pennington'::text, 'Chapman Pennington'::text),
                ('Claire'::text, 'Bullard'::text, DATE '1994-12-14', 'Claire Bullard'::text, 'Claire Elizabeth Chandler Bullard'::text),
                ('David'::text, 'Hitchman'::text, DATE '1991-11-27', 'David Hitchman'::text, 'David Graham Hitchman'::text),
                ('Dean'::text, 'Ross'::text, DATE '1969-09-16', 'Dean Ross'::text, 'Dean Lance Ross'::text),
                ('Deana'::text, 'Cherry'::text, DATE '1972-08-23', 'Deana Cherry'::text, 'Deana Marie Deluca Cherry'::text),
                ('Derek'::text, 'Garber'::text, DATE '1982-04-13', 'Derek Garber'::text, 'Jason Derek Garber'::text),
                ('Edward Lee'::text, 'Wilkins'::text, DATE '1950-11-17', 'Edward Lee Wilkins'::text, 'Edward Lee Wilkins'::text),
                ('Elisabeth'::text, 'Hendrickson'::text, DATE '1995-05-02', 'Elisabeth Hendrickson'::text, 'Elizabeth Poulos Hendrickson'::text),
                ('Ellen'::text, 'Cherry'::text, DATE '1950-12-22', 'Ellen Cherry'::text, 'Ellen Irene Lafreniere Cherry'::text),
                ('Emma'::text, 'Bullard'::text, DATE '2005-04-19', 'Emma Bullard'::text, 'Emma Carleton Bullard'::text),
                ('Erica'::text, 'Bullard'::text, DATE '1968-04-16', 'Erica Bullard'::text, 'Erica Stewart Bullard'::text),
                ('Faith'::text, 'Bullard'::text, DATE '1975-03-31', 'Faith Bullard'::text, 'Faith Jennifer Hampton Bullard'::text),
                ('Faith'::text, 'Hendrickson'::text, DATE '1997-03-19', 'Faith Hendrickson'::text, 'Faith Jan Wolfard Hendrickson'::text),
                ('Frederick Tinsley Donne'::text, 'Cherry'::text, DATE '1912-02-06', 'Frederick Tinsley Donne Cherry'::text, 'Dad Frederick Tinsley Donne Cherry'::text),
                ('Genel'::text, 'Bullard'::text, DATE '1962-10-16', 'Genel Bullard'::text, 'Carol Genel George Bullard'::text),
                ('Grace'::text, 'Etbauer'::text, DATE '1999-03-10', 'Grace Etbauer'::text, 'Grace Wikstorm Etbauer'::text),
                ('Hannah'::text, 'McMonigle'::text, DATE '1982-03-25', 'Hannah McMonigle'::text, 'Hannah Olivia Mckellar Mcmonigle'::text),
                ('Heath'::text, 'Kufahl'::text, DATE '1976-02-27', 'Heath Kufahl'::text, 'Heath Dale Kufahl'::text),
                ('Herschel'::text, 'Arant'::text, DATE '1972-04-11', 'Herschel Arant'::text, 'Herschel Arant'::text),
                ('Ismael'::text, 'Guillen'::text, DATE '1986-12-11', 'Ismael Guillen'::text, 'Ismael Guillen'::text),
                ('Jackie'::text, 'Cherry'::text, DATE '1946-12-11', 'Jackie Cherry'::text, 'Jacquline Kaye Martin Cherry'::text),
                ('Jaclyn'::text, 'Bullard'::text, DATE '1995-12-25', 'Jaclyn Bullard'::text, 'Jaclyn Bullard'::text),
                ('Jamie'::text, 'Bullard'::text, DATE '1987-01-06', 'Jamie Bullard'::text, 'Jamie Lee Schhriewer Bullard'::text),
                ('Joseph'::text, 'Bond'::text, DATE '1987-02-18', 'Joseph Bond'::text, 'Joseph Scott Bond'::text),
                ('Karen'::text, 'Bullard'::text, DATE '1973-06-12', 'Karen Bullard'::text, 'Karen Hill Bullard'::text),
                ('Karen'::text, 'Cherry'::text, DATE '1953-05-24', 'Karen Cherry'::text, 'Karen Sue Thompson Cherry'::text),
                ('Karl Wesley'::text, 'Evans'::text, DATE '1996-11-02', 'Karl Wesley Evans'::text, 'Karl Wesley Evans'::text),
                ('Kathy Jane'::text, 'Cherry'::text, DATE '1954-03-26', 'Kathy Jane Cherry'::text, 'Kathy Jane Leveridge Cherry'::text),
                ('Kelly'::text, 'Burleson'::text, DATE '1963-06-07', 'Kelly Burleson'::text, 'Kelly Prichard Lance Burleson'::text),
                ('Kena'::text, 'Thompson'::text, DATE '1983-02-27', 'Kena Thompson'::text, 'Kena Eileen Harris Thompson'::text),
                ('Kris'::text, 'Glasser'::text, DATE '1982-02-28', 'Kris Glasser'::text, 'Andrew Kristopher Glasser'::text),
                ('Kriste'::text, 'Cherry'::text, DATE '1983-09-19', 'Kriste Cherry'::text, 'Kriste Michelle Limbaugh Cherry'::text),
                ('Laura'::text, 'Hendrickson'::text, DATE '1990-06-12', 'Laura Hendrickson'::text, 'Laura Alison Jacobs Hendrickson'::text),
                ('Mark'::text, 'Breeden'::text, DATE '1978-12-02', 'Mark Breeden'::text, 'Mark William Breeden'::text),
                ('Matt'::text, 'Jantzen'::text, DATE '1978-06-24', 'Matt Jantzen'::text, 'Matthew Davis Jantzen'::text),
                ('Max'::text, 'Masters'::text, DATE '1980-06-17', 'Max Masters'::text, 'Max Aaron Masters'::text),
                ('Megan'::text, 'Austin'::text, DATE '1983-11-15', 'Megan Austin'::text, 'Megan Slaughter Austin'::text),
                ('Mick'::text, 'Majors'::text, DATE '1984-06-16', 'Mick Majors'::text, 'Michael Neely Majors'::text),
                ('Molly'::text, 'Bullard'::text, DATE '1998-10-20', 'Molly Bullard'::text, 'Molly Beth Harris Bullard'::text),
                ('Molly'::text, 'Cherry'::text, DATE '1970-06-05', 'Molly Cherry'::text, 'Molly Kehoe Cherry'::text),
                ('Morgan'::text, 'Bullard'::text, DATE '1998-03-05', 'Morgan Bullard'::text, 'Morgan Elizabeth O''kane Bullard'::text),
                ('Nancy'::text, 'Bullard'::text, DATE '1968-06-26', 'Nancy Bullard'::text, 'Nancy Kay Fross Bullard'::text),
                ('Nicole'::text, 'Burleson'::text, DATE '1993-10-22', 'Nicole Burleson'::text, 'Nicole Burleson'::text),
                ('Paul'::text, 'Burleson'::text, DATE '1940-07-19', 'Paul Burleson'::text, 'William Paul Burleson'::text),
                ('Payton'::text, 'Bullard'::text, DATE '1998-05-06', 'Payton Bullard'::text, 'Payton Bullard'::text),
                ('Phillip Dewayne'::text, 'Fraim'::text, DATE '1956-01-10', 'Phillip Dewayne Fraim'::text, 'Phillip Dewayne Fraim'::text),
                ('Preston'::text, 'Stadtmiller'::text, DATE '1988-03-15', 'Preston Stadtmiller'::text, 'Preston David Stadtmiller'::text),
                ('Rachelle'::text, 'Burleson'::text, DATE '1963-01-28', 'Rachelle Burleson'::text, 'Rachelle Lynn Mock Burleson'::text),
                ('Ralph'::text, 'Bullard'::text, DATE '1937-11-21', 'Ralph Bullard'::text, 'Carl Ralph Bullard'::text),
                ('Robert'::text, 'Rigoulot'::text, DATE '1959-07-15', 'Robert Rigoulot'::text, 'Robert Rigoulot'::text),
                ('Ryan'::text, 'McNeill'::text, DATE '1976-12-18', 'Ryan McNeill'::text, 'Patrick Ryan Mcneill'::text),
                ('Ryan'::text, 'Morrisett'::text, DATE '1992-11-14', 'Ryan Morrisett'::text, 'Ryan William Morrisett'::text),
                ('Sarah'::text, 'Wilkins'::text, DATE '1981-12-26', 'Sarah Wilkins'::text, 'Sarah Chambers Wilkins'::text),
                ('Shayna'::text, 'Thompson'::text, DATE '1982-09-24', 'Shayna Thompson'::text, 'Shayna Lee Schaefer Thompson'::text),
                ('Shelby'::text, 'Fraim'::text, DATE '1981-03-19', 'Shelby Fraim'::text, 'Shelby Dalynn Wilson Fraim'::text),
                ('Susan'::text, 'Bullard'::text, DATE '1967-02-15', 'Susan Bullard'::text, 'Susan Rea Ratliff Bullard'::text),
                ('Thomas'::text, 'Ratliff'::text, DATE '1980-11-06', 'Thomas Ratliff'::text, 'Thomas Ratliff'::text),
                ('Tim'::text, 'Hendrickson'::text, DATE '1960-10-31', 'Tim Hendrickson'::text, 'Timothy Dean Hendrickson'::text),
                ('Tom'::text, 'McMonigle'::text, DATE '1942-12-12', 'Tom McMonigle'::text, 'William Thomas Mcmonigle'::text),
                ('Tony'::text, 'Lenox'::text, DATE '1959-10-10', 'Tony Lenox'::text, 'Anthony Gene Lenox'::text),
                ('Travis'::text, 'Downey'::text, DATE '1981-11-13', 'Travis Downey'::text, 'Travis Andrew Downey'::text),
                ('Tyler'::text, 'Owen'::text, DATE '1988-01-04', 'Tyler Owen'::text, 'Tyler Wayne Owen'::text)
        ) AS birthday_updates(first_name, last_name, birthday, partner_full_name, source_full_name)
    LOOP
        UPDATE partners
        SET birthday = r.birthday
        WHERE first_name = r.first_name
          AND last_name = r.last_name;

        GET DIAGNOSTICS updated_count = ROW_COUNT;

        IF updated_count = 0 THEN
            RAISE EXCEPTION
                'No partners row matched "%": first_name="%", last_name="%". Entire transaction rolled back.',
                r.partner_full_name,
                r.first_name,
                r.last_name;
        END IF;

        RAISE NOTICE
            'Updated % partner row(s) for "%" to birthday % (source: "%").',
            updated_count,
            r.partner_full_name,
            r.birthday,
            r.source_full_name;
    END LOOP;
END
$$;

COMMIT;

-- Names for which no sufficiently plausible birthday was found in the supplied data:
--   Aaron Stevens
--   Aiden Ross
--   Ali Khalafalla
--   Becca Susko
--   Briana Cherry
--   Camille Bullard
--   Grace Hendrickson
--   Grayson Allred
--   Greg Austin
--   Jesus Hernandez
--   Joy Hendrickson
--   Kasia Bullard
--   Mackenzie Burleson
--   Mike Moxley
--   Reid McDuff
--   Robin McMonigle
--   Shandee Stine
--   T.J. Jauss Jr.
--   Tanner McBee
--   Wade Haugen

--
-- Unresolved ambiguous name:
--   Brooke Bullard
--     1981-04-23 = Brooke Elizabeth English Bullard
--     1997-05-22 = Brooke Beitzel Bullard
--
-- Other notable fuzzy matches used:
--   Alex Hendrickson <= Alexandra Maria Chiu Hendrickson (1985-02-20)
--   Andrew Smith <= Andrew Blake Smith (1987-05-07)
--   Anne Burleson <= Anne Elizabeth Karns Burleson (1987-10-08)
--   Becky Bullard <= Rebecca Elizabeth Brenner Bullard (1973-08-29)
--   Ben Pope <= Benjamin Pope (1988-07-15)
--   Billy Etbauer <= Billy Joe Etbauer (1963-01-15)
--   Braden Canino <= Braden Justus Canino (1997-02-04)
--   Claire Bullard <= Claire Elizabeth Chandler Bullard (1994-12-14)
--   David Hitchman <= David Graham Hitchman (1991-11-27)
--   Dean Ross <= Dean Lance Ross (1969-09-16)
--   Deana Cherry <= Deana Marie Deluca Cherry (1972-08-23)
--   Derek Garber <= Jason Derek Garber (1982-04-13)
--   Elisabeth Hendrickson <= Elizabeth Poulos Hendrickson (1995-05-02)
--   Ellen Cherry <= Ellen Irene Lafreniere Cherry (1950-12-22)
--   Emma Bullard <= Emma Carleton Bullard (2005-04-19)
--   Erica Bullard <= Erica Stewart Bullard (1968-04-16)
--   Faith Bullard <= Faith Jennifer Hampton Bullard (1975-03-31)
--   Faith Hendrickson <= Faith Jan Wolfard Hendrickson (1997-03-19)
--   Frederick Tinsley Donne Cherry <= Dad Frederick Tinsley Donne Cherry (1912-02-06)
--   Genel Bullard <= Carol Genel George Bullard (1962-10-16)
--   Grace Etbauer <= Grace Wikstorm Etbauer (1999-03-10)
--   Hannah McMonigle <= Hannah Olivia Mckellar Mcmonigle (1982-03-25)
--   Heath Kufahl <= Heath Dale Kufahl (1976-02-27)
--   Jackie Cherry <= Jacquline Kaye Martin Cherry (1946-12-11)
--   Jamie Bullard <= Jamie Lee Schhriewer Bullard (1987-01-06)
--   Joseph Bond <= Joseph Scott Bond (1987-02-18)
--   Karen Bullard <= Karen Hill Bullard (1973-06-12)
--   Karen Cherry <= Karen Sue Thompson Cherry (1953-05-24)
--   Kathy Jane Cherry <= Kathy Jane Leveridge Cherry (1954-03-26)
--   Kelly Burleson <= Kelly Prichard Lance Burleson (1963-06-07)
--   Kena Thompson <= Kena Eileen Harris Thompson (1983-02-27)
--   Kris Glasser <= Andrew Kristopher Glasser (1982-02-28)
--   Kriste Cherry <= Kriste Michelle Limbaugh Cherry (1983-09-19)
--   Laura Hendrickson <= Laura Alison Jacobs Hendrickson (1990-06-12)
--   Mark Breeden <= Mark William Breeden (1978-12-02)
--   Matt Jantzen <= Matthew Davis Jantzen (1978-06-24)
--   Max Masters <= Max Aaron Masters (1980-06-17)
--   Megan Austin <= Megan Slaughter Austin (1983-11-15)
--   Mick Majors <= Michael Neely Majors (1984-06-16)
--   Molly Bullard <= Molly Beth Harris Bullard (1998-10-20)
--   Molly Cherry <= Molly Kehoe Cherry (1970-06-05)
--   Morgan Bullard <= Morgan Elizabeth O'kane Bullard (1998-03-05)
--   Nancy Bullard <= Nancy Kay Fross Bullard (1968-06-26)
--   Paul Burleson <= William Paul Burleson (1940-07-19)
--   Preston Stadtmiller <= Preston David Stadtmiller (1988-03-15)
--   Rachelle Burleson <= Rachelle Lynn Mock Burleson (1963-01-28)
--   Ralph Bullard <= Carl Ralph Bullard (1937-11-21)
--   Ryan McNeill <= Patrick Ryan Mcneill (1976-12-18)
--   Ryan Morrisett <= Ryan William Morrisett (1992-11-14)
--   Sarah Wilkins <= Sarah Chambers Wilkins (1981-12-26)
--   Shayna Thompson <= Shayna Lee Schaefer Thompson (1982-09-24)
--   Shelby Fraim <= Shelby Dalynn Wilson Fraim (1981-03-19)
--   Susan Bullard <= Susan Rea Ratliff Bullard (1967-02-15)
--   Tim Hendrickson <= Timothy Dean Hendrickson (1960-10-31)
--   Tom McMonigle <= William Thomas Mcmonigle (1942-12-12)
--   Tony Lenox <= Anthony Gene Lenox (1959-10-10)
--   Travis Downey <= Travis Andrew Downey (1981-11-13)
--   Tyler Owen <= Tyler Wayne Owen (1988-01-04)
