CREATE SCHEMA cookhack;
CREATE EXTENSION pg_trgm SCHEMA cookhack;
SET pg_trgm.word_similarity_threshold to 0.1;
CREATE TABLE cookhack.Recipe (
    id          SERIAL        NOT NULL,
    name        VARCHAR(80)   NOT NULL,
    description TEXT   ,
    PRIMARY KEY (id)
);

CREATE TABLE cookhack.Foodstuff (
    id              SERIAL          NOT NULL,
    name            VARCHAR(80)     NOT NULL,
    carbohydrate    FLOAT,
    protein         FLOAT,
    lipid           FLOAT,
    PRIMARY KEY (id)
);

CREATE TABLE cookhack.FoodstuffIncludedRecipe (
    id              SERIAL  NOT NULL,
    recipe_id       INT     NOT NULL,
    foodstuff_id    INT     NOT NULL,
    gram            FLOAT,
    PRIMARY KEY (id),
    FOREIGN KEY (recipe_id) REFERENCES cookhack.Recipe(id),
    FOREIGN KEY (foodstuff_id) REFERENCES cookhack.Foodstuff(id)
);


CREATE TABLE cookhack.User (
    id                  SERIAL          NOT NULL,
    name                varchar(64)     NOT NULL,
--    email       varchar(80),    NOT NULL,
--    password    varchar(80),    NOT NULL,
    carbohydrate_id     INT             NOT NULL,
    protein_id          INT             NOT NULL,
    lipid_id            INT             NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE cookhack.UsersCarbohydrate(
    id              INT     NOT NULL,
    sunday          FLOAT,
    monday          FLOAT,
    tuesday         FLOAT,
    wednesday       FLOAT,
    thursday        FLOAT,
    friday          FLOAT,
    saturday        FLOAT,
    FOREIGN KEY (id) REFERENCES cookhack.User(id)
);

CREATE TABLE cookhack.UsersProtein(
    id              INT     NOT NULL,
    sunday          FLOAT,
    monday          FLOAT,
    tuesday         FLOAT,
    wednesday       FLOAT,
    thursday        FLOAT,
    friday          FLOAT,
    saturday        FLOAT,
    FOREIGN KEY (id) REFERENCES cookhack.User(id)
);

CREATE TABLE cookhack.UsersLipid(
    id              INT     NOT NULL,
    sunday          FLOAT,
    monday          FLOAT,
    tuesday         FLOAT,
    wednesday       FLOAT,
    thursday        FLOAT,
    friday          FLOAT,
    saturday        FLOAT,
    FOREIGN KEY (id) REFERENCES cookhack.User(id)
);