// Shared Knex connection factory for the observation and visualization databases.
const knex = require("knex");
const config = require("../config/appConfig");

function createDbConnection(settings) {
  return knex({
    client: "mysql2",
    connection: {
      host: settings.host,
      user: settings.user,
      password: settings.password,
      database: settings.db,
      port: settings.port,
    },
    pool: { min: 0, max: 10 },
  });
}

const observationDb = createDbConnection(config.observationDatabase);
const visualizationDb = createDbConnection(config.visualizationDatabase);

module.exports = {
  observationDb,
  visualizationDb,
};
