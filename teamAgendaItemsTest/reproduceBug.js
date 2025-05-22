// This is a standalone script to reproduce the bug without needing the full test infrastructure
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
  GraphQLID,
  execute,
  parse
} = require('graphql')

// Mock AgendaItem type
const AgendaItemType = new GraphQLObjectType({
  name: 'AgendaItem',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    content: {type: new GraphQLNonNull(GraphQLString)}
  }
})

// Mock Team type with the buggy resolver
const TeamType = new GraphQLObjectType({
  name: 'Team',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    name: {type: new GraphQLNonNull(GraphQLString)},
    agendaItems: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(AgendaItemType))),
      resolve: (parent, args, context) => {
        // This is the bug - returning null for a non-nullable field
        // When isTeamMember is false, it should return an empty array instead
        const isTeamMember = context.authToken === parent.ownerAuthToken
        if (!isTeamMember) return null
        return parent.agendaItems || []
      }
    }
  }
})

// Simple schema
const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      team: {
        type: TeamType,
        args: {
          id: {type: new GraphQLNonNull(GraphQLID)}
        },
        resolve: (parent, args) => {
          // Mock team data
          return {
            id: args.id,
            name: 'Test Team',
            ownerAuthToken: 'owner-token',
            agendaItems: [
              {id: '1', content: 'Item 1'},
              {id: '2', content: 'Item 2'}
            ]
          }
        }
      }
    }
  })
})

// Execute the query
async function runTest() {
  console.log(
    'Running test to reproduce "Cannot return null for non-nullable field Team.agendaItems" bug'
  )

  const query = `
    query GetTeamDetails($teamId: ID!) {
      team(id: $teamId) {
        id
        name
        agendaItems {
          id
          content
        }
      }
    }
  `

  // Case 1: Team member - should succeed
  const resultMember = await execute({
    schema,
    document: parse(query),
    variableValues: {teamId: '1'},
    contextValue: {authToken: 'owner-token'}
  })

  console.log('\nTeam member query result:')
  console.log(JSON.stringify(resultMember, null, 2))

  // Case 2: Non-team member - should fail with the specific error
  try {
    const resultNonMember = await execute({
      schema,
      document: parse(query),
      variableValues: {teamId: '1'},
      contextValue: {authToken: 'non-owner-token'}
    })

    console.log('\nNon-team member query result:')
    console.log(JSON.stringify(resultNonMember, null, 2))

    // Check for the expected error
    if (resultNonMember.errors && resultNonMember.errors.length > 0) {
      const errorMessage = resultNonMember.errors[0].message
      if (errorMessage.includes('Cannot return null for non-nullable field Team.agendaItems')) {
        console.log('\n✅ Bug successfully reproduced!')
        console.log('Error message: ' + errorMessage)
        console.log(
          '\nThe bug occurs because the agendaItems resolver returns null when isTeamMember is false'
        )
        console.log(
          'This violates the GraphQL schema which defines agendaItems as a non-nullable field [AgendaItem!]!'
        )
        console.log(
          'Fix: The resolver should return an empty array [] instead of null when a user is not a team member'
        )
        process.exit(1) // Exit with error to indicate bug was reproduced
      } else {
        console.log('\n❌ Different error occurred:', errorMessage)
      }
    } else {
      console.log('\n❌ No error occurred, but one was expected')
    }
  } catch (error) {
    console.log('\n✅ Bug successfully reproduced!')
    console.log('Error: ' + error.message)
    process.exit(1) // Exit with error to indicate bug was reproduced
  }
}

runTest()
