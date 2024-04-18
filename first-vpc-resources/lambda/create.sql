CREATE TABLE IF NOT EXISTS animals (
    animal_id uuid DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    color VARCHAR NOT NULL,
    PRIMARY KEY (animal_id)
);
