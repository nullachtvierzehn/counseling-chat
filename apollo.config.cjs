module.exports = {
  client: {
    includes: [`${__dirname}/graphql/**/*.graphql`],
    service: {
      name: "postgraphile",
      localSchemaFile: `${__dirname}/schema.graphql`,
    },
  },
}
