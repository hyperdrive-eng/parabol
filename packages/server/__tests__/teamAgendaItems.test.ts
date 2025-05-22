import {sendPublic, signUp} from './common'

test('Team.agendaItems returns null for non-team member causing GraphQL error', async () => {
  // Sign up two users
  const {userId: userId1, authToken: authToken1} = await signUp()
  const {userId: userId2, authToken: authToken2} = await signUp()
  
  // First user creates a team (happens automatically during signup)
  const getTeam = await sendPublic({
    query: `
      query GetMyTeams {
        viewer {
          teams {
            id
            name
          }
        }
      }
    `,
    authToken: authToken1
  })
  
  expect(getTeam.data.viewer.teams.length).toBeGreaterThan(0)
  const teamId = getTeam.data.viewer.teams[0].id
  
  // Second user tries to query the team's agendaItems (even though they're not a member)
  // This should reproduce the error: "Cannot return null for non-nullable field Team.agendaItems"
  const getTeamDetails = await sendPublic({
    query: `
      query GetTeamDetails($teamId: ID!) {
        team(teamId: $teamId) {
          id
          name
          agendaItems {
            id
            content
          }
        }
      }
    `,
    variables: {
      teamId
    },
    authToken: authToken2
  })
  
  // This should have an error since we're returning null for a non-nullable field
  expect(getTeamDetails.errors).toBeTruthy()
  const errorMessage = getTeamDetails.errors[0].message
  expect(errorMessage).toContain('Cannot return null for non-nullable field Team.agendaItems')
})
