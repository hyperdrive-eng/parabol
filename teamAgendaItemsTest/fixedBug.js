// This is a standalone script to demonstrate the fix for the bug
const { GraphQLSchema, GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLString, GraphQLID, execute, parse } = require('graphql');

// Mock AgendaItem type
const AgendaItemType = new GraphQLObjectType({
  name: 'AgendaItem',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    content: { type: new GraphQLNonNull(GraphQLString) }
  }
});

// Mock Team type with the FIXED resolver
const TeamType = new GraphQLObjectType({
  name: 'Team',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    agendaItems: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(AgendaItemType))),
      resolve: (parent, args, context) => {
        // FIX: Return empty array instead of null when user is not a team member
        const isTeamMember = context.authToken === parent.ownerAuthToken;
        if (!isTeamMember) return [];
        return parent.agendaItems || [];
      }
    }
  }
});

// Simple schema
const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      team: {
        type: TeamType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) }
        },
        resolve: (parent, args) => {
          // Mock team data
          return {
            id: args.id,
            name: 'Test Team',
            ownerAuthToken: 'owner-token',
            agendaItems: [
              { id: '1', content: 'Item 1' },
              { id: '2', content: 'Item 2' }
            ]
          };
        }
      }
    }
  })
});

// Execute the query
async function runTest() {
  console.log('Running test with the FIXED resolver - should not error');
  
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
  `;
  
  // Case 1: Team member - should succeed
  const resultMember = await execute({
    schema,
    document: parse(query),
    variableValues: { teamId: '1' },
    contextValue: { authToken: 'owner-token' }
  });
  
  console.log('\nTeam member query result:');
  console.log(JSON.stringify(resultMember, null, 2));
  
  // Case 2: Non-team member - should now succeed with empty array
  const resultNonMember = await execute({
    schema,
    document: parse(query),
    variableValues: { teamId: '1' },
    contextValue: { authToken: 'non-owner-token' }
  });
  
  console.log('\nNon-team member query result:');
  console.log(JSON.stringify(resultNonMember, null, 2));
  
  // Check for the expected result
  if (resultNonMember.errors) {
    console.log('\n❌ Fix not working! Errors occurred:', JSON.stringify(resultNonMember.errors, null, 2));
  } else if (
    resultNonMember.data &&
    resultNonMember.data.team &&
    Array.isArray(resultNonMember.data.team.agendaItems) &&
    resultNonMember.data.team.agendaItems.length === 0
  ) {
    console.log('\n✅ Fix successfully implemented!');
    console.log('Non-team members now receive an empty array instead of null');
    console.log('This satisfies the GraphQL schema requirement for a non-nullable field');
  } else {
    console.log('\n❌ Unexpected result:', JSON.stringify(resultNonMember, null, 2));
  }
}

runTest();
