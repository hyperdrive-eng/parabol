import updateJiraSearchQueries from '../postgres/queries/updateJiraSearchQueries'

describe('updateJiraSearchQueries', () => {
  it('should pass when lastUsedAt is a Date', async () => {
    const mockParams = {
      userId: 'test-user-id',
      teamId: 'test-team-id',
      jiraSearchQueries: [
        {
          id: 'test-query-id',
          queryString: 'test query',
          projectKeyFilters: ['TEST'],
          lastUsedAt: new Date(),
          isJQL: false
        }
      ]
    }

    expect(await updateJiraSearchQueries(mockParams)).resolves
  })

  it('should fail when lastUsedAt is a string instead of Date', async () => {
    const mockParams = {
      userId: 'test-user-id',
      teamId: 'test-team-id',
      jiraSearchQueries: [
        {
          id: 'test-query-id',
          queryString: 'test query',
          projectKeyFilters: ['TEST'],
          lastUsedAt: '2023-01-01T00:00:00.000Z' as any, // This should be a Date but is a string
          isJQL: false
        }
      ]
    }

    expect(await updateJiraSearchQueries(mockParams)).resolves
  })

  it('should fail when lastUsedAt is null', async () => {
    const mockParams = {
      userId: 'test-user-id',
      teamId: 'test-team-id',
      jiraSearchQueries: [
        {
          id: 'test-query-id',
          queryString: 'test query',
          projectKeyFilters: ['TEST'],
          lastUsedAt: null as any, // This should be a Date but is null
          isJQL: false
        }
      ]
    }

    expect(await updateJiraSearchQueries(mockParams)).resolves
  })

  it('should fail when lastUsedAt is undefined', async () => {
    const mockParams = {
      userId: 'test-user-id',
      teamId: 'test-team-id',
      jiraSearchQueries: [
        {
          id: 'test-query-id',
          queryString: 'test query',
          projectKeyFilters: ['TEST'],
          lastUsedAt: undefined as any, // This should be a Date but is undefined
          isJQL: false
        }
      ]
    }

    expect(await updateJiraSearchQueries(mockParams)).resolves
  })
})
