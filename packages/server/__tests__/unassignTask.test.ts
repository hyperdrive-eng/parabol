import {getUserTeams, sendPublic, signUp} from './common'

test('Debug task unassignment notification issue', async () => {
  // Sign up a user
  const {userId, authToken} = await signUp()
  console.log('[TEST] Signed up user:', userId)

  // Get user's teams first
  const teams = await getUserTeams(userId)
  const teamId = teams[0].id
  console.log('[TEST] Using team:', teamId)

  // Create a task assigned to the user
  const createTask = await sendPublic({
    query: `
      mutation CreateTask($newTask: CreateTaskInput!) {
        createTask(newTask: $newTask) {
          task {
            id
            userId
          }
        }
      }
    `,
    variables: {
      newTask: {
        content:
          '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Debug task"}]}]}',
        status: 'active',
        teamId: teamId,
        userId: userId
      }
    },
    authToken
  })

  if (!createTask.data || !createTask.data.createTask) {
    console.error('[TEST] Task creation failed:', JSON.stringify(createTask, null, 2))
    throw new Error('Failed to create task')
  }

  const taskId = createTask.data.createTask.task.id
  console.log(
    '[TEST] Created task:',
    taskId,
    'assigned to:',
    createTask.data.createTask.task.userId
  )

  // Try different GraphQL query formats to unassign the task
  console.log('[TEST] Attempting task unassignment with format 1')
  const updateTask1 = await sendPublic({
    query: `
      mutation UpdateTask($updatedTask: UpdateTaskInput!) {
        updateTask(updatedTask: $updatedTask) {
          taskId
        }
      }
    `,
    variables: {
      updatedTask: {
        id: taskId,
        userId: null
      }
    },
    authToken
  })
  console.log('[TEST] Update Task Result 1:', JSON.stringify(updateTask1, null, 2))

  // Try a different format
  console.log('[TEST] Attempting task unassignment with format 2')
  const updateTask2 = await sendPublic({
    query: `
      mutation UpdateTask($id: ID!, $changes: TaskUpdateInput!) {
        updateTask(id: $id, changes: $changes) {
          taskId
        }
      }
    `,
    variables: {
      id: taskId,
      changes: {
        userId: null
      }
    },
    authToken
  })
  console.log('[TEST] Update Task Result 2:', JSON.stringify(updateTask2, null, 2))

  // Try yet another format
  console.log('[TEST] Attempting task unassignment with format 3')
  const updateTask3 = await sendPublic({
    query: `
      mutation {
        updateTask(updatedTask: {id: "${taskId}", userId: null}) {
          taskId
        }
      }
    `,
    variables: {},
    authToken
  })
  console.log('[TEST] Update Task Result 3:', JSON.stringify(updateTask3, null, 2))

  // Check task status after all attempts
  console.log('[TEST] Checking task status after update attempts')
  const getTask = await sendPublic({
    query: `
      query GetTask($taskId: ID!) {
        task(id: $taskId) {
          id
          userId
        }
      }
    `,
    variables: {
      taskId: taskId
    },
    authToken
  })
  console.log('[TEST] Current task status:', JSON.stringify(getTask, null, 2))

  // Don't make any assertions - this is purely for debugging
})
