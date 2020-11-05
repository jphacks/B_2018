CREATE SCHEMA cookhack;
CREATE TABLE cookhack.Recipe (
    id      SERIAL     NOT NULL,
    name    VARCHAR(80)   NOT NULL,
    description    TEXT   ,
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

/*
CREATE TABLE User (
    id          INT,    NOT NULL,
    name        varchar(64),    NOT NULL,
    email       varchar(80),    NOT NULL,
    password    varchar(80),    NOT NULL,
    PRIMARY KEY (id)
);
*/