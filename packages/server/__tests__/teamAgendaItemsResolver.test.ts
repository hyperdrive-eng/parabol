import Team from '../graphql/types/Team'
import {isTeamMember} from '../utils/authorization'

// Mock the authorization module
jest.mock('../utils/authorization', () => ({
  isTeamMember: jest.fn()
}))

describe('Team.agendaItems resolver', () => {
  // Extract the agendaItems resolver from the Team type
  const agendaItemsResolver = Team.getFields().agendaItems?.resolve
  if (!agendaItemsResolver) {
    throw new Error('agendaItems resolver is not defined')
  }

  test('should return null for non-team members, causing GraphQL error', async () => {
    // Set up mocks
    const teamId = 'team123'
    const mockTeam = {id: teamId}
    const mockAuthToken = {sub: 'user123', tms: ['otherTeam123']}
    const mockDataLoader = {
      get: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue([])
      })
    }
    const mockContext = {authToken: mockAuthToken, dataLoader: mockDataLoader}

    // Mock the authorization check to simulate a non-team member
    const mockedIsTeamMember = isTeamMember as jest.Mock
    mockedIsTeamMember.mockReturnValue(false)

    // Call the resolver
    const result = await agendaItemsResolver(mockTeam, {}, mockContext, {} as any)

    // Verify the resolver returns null for non-team members
    expect(result).toBeNull()
    expect(isTeamMember).toHaveBeenCalledWith(mockAuthToken, teamId)

    console.log(`
    TEST CONFIRMS BUG: Team.agendaItems resolver returns null for non-team members.

    This causes the GraphQL error: "Cannot return null for non-nullable field Team.agendaItems"
    because the field is defined as non-nullable in the schema:

    type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(AgendaItem)))

    FIX: Change the resolver implementation from:
    if (!isTeamMember(authToken, teamId)) return null

    To:
    if (!isTeamMember(authToken, teamId)) return []
    `)
  })

  test('should return an empty array for non-team members after fix', async () => {
    // Set up mocks
    const teamId = 'team123'
    const mockTeam = {id: teamId}
    const mockAuthToken = {sub: 'user123', tms: ['otherTeam123']}
    const mockDataLoader = {
      get: jest.fn().mockReturnValue({
        load: jest.fn().mockResolvedValue([])
      })
    }
    const mockContext = {authToken: mockAuthToken, dataLoader: mockDataLoader}

    // Mock the authorization check to simulate a non-team member
    const mockedIsTeamMember = isTeamMember as jest.Mock
    mockedIsTeamMember.mockReturnValue(false)

    // Call the resolver
    const result = await agendaItemsResolver(mockTeam, {}, mockContext, {} as any)

    // IMPORTANT: This test will fail until you fix the resolver!
    // After the fix, it should return an empty array instead of null
    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual([])

    console.log(`
    After the fix, this test should pass, confirming that the resolver now returns
    an empty array for non-team members, which satisfies the GraphQL schema requirements.
    `)
  })
})
