import {getUserTeams, sendPublic, signUp} from './common'

test('Unassigning a task causes a not-null constraint violation in Notification', async () => {
  // Sign up a user
  const {userId, authToken} = await signUp()

  // Get user's teams first
  const teams = await getUserTeams(userId)

  // Extract the teamId from the response
  // getUserTeams already asserts that the user has at least one team
  const teamId = teams[0].id

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
          '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Test task"}]}]}',
        status: 'active',
        teamId: teamId, // Using a real teamId
        userId: userId // Assign to self
      }
    },
    authToken
  })

  // Debug output if task creation fails
  if (!createTask.data || !createTask.data.createTask) {
    console.error('Task creation failed:', JSON.stringify(createTask, null, 2))
    throw new Error('Failed to create task')
  }

  expect(createTask.data.createTask.task.id).toBeTruthy()
  expect(createTask.data.createTask.task.userId).toBe(userId)

  const taskId = createTask.data.createTask.task.id

  // Now attempt to unassign the task (set userId to null)
  // This should trigger the bug where a null userId is used in a notification
  const updateTask = await sendPublic({
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
        userId: null // Unassign the task
      }
    },
    authToken
  })

  // If the bug exists, this should fail with a constraint violation
  // The error should be in the GraphQL errors array
  expect(updateTask.errors).toBeTruthy()
  const errorMessage = updateTask.errors[0].message
  expect(errorMessage).toContain('violates not-null constraint')
  expect(errorMessage).toContain('column "userId" of relation "Notification"')
})
