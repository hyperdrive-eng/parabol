import getPg from '../getPg'
import {
  IUpdateJiraSearchQueriesQueryParams,
  updateJiraSearchQueriesQuery
} from './generated/updateJiraSearchQueriesQuery'

interface UpdateJiraSearchQueryParams
  extends Omit<IUpdateJiraSearchQueriesQueryParams, 'jiraSearchQueries'> {
  jiraSearchQueries: {
    id: string
    queryString: string
    projectKeyFilters?: string[]
    lastUsedAt: Date
    isJQL: boolean
  }[]
}

const updateJiraSearchQueries = async (params: UpdateJiraSearchQueryParams) => {
  const updateParams = {
    ...params,
    jiraSearchQueries: params.jiraSearchQueries.map((jsq) => {
      let lastUsedAtDate: Date

      if (jsq.lastUsedAt instanceof Date) {
        lastUsedAtDate = jsq.lastUsedAt
      } else if (jsq.lastUsedAt) {
        lastUsedAtDate = new Date(jsq.lastUsedAt)
      } else {
        lastUsedAtDate = new Date()
      }

      return {
        id: jsq.id,
        queryString: jsq.queryString,
        projectKeyFilters: jsq.projectKeyFilters,
        lastUsedAt: lastUsedAtDate.toJSON(),
        isJQL: jsq.isJQL
      }
    })
  } as IUpdateJiraSearchQueriesQueryParams

  await updateJiraSearchQueriesQuery.run(updateParams, getPg())
}
export default updateJiraSearchQueries
