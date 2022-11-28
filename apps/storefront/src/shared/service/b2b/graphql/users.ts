import {
  B3Request,
} from '../../request/b3Fetch'

const getUsersQl = (data: CustomFieldItems) => `{
  users (
    first: ${data.first}
    search: "${data.q || ''}"
    offset: ${data.offset}
    companyId: ${data.companyId}
    ${data.role === '' ? '' : `role: ${data.role}`}
  ){
    totalCount,
    pageInfo{
      hasNextPage,
      hasPreviousPage,
    },
    edges{
      node{
        id,
        createdAt,
        updatedAt,
        firstName,
        lastName,
        email,
        phone,
        bcId,
        role,
        uuid,
      }
    }
  }
}`

const addOrUpdateUsersQl = (data: CustomFieldItems) => `mutation{
  ${data?.userId ? 'userUpdate' : 'userCreate'} (
    userData: {
      companyId: ${data.companyId}
      ${data?.email ? `email: "${data.email}"` : ''}
      firstName: "${data.firstName || ''}"
      lastName: "${data.lastName || ''}"
      phone: "${data.phone || ''}"
      role: ${data.role}
      ${data?.userId ? `userId: ${data.userId}` : ''}
    }
  ){
    user{
      id,
      bcId,
    }
  }
}`

const deleteUsersQl = (data: CustomFieldItems) => `mutation{
  userDelete (
    companyId: ${data.companyId}
    userId: ${data.userId}
  ){
    message
  }
}`
export const getUsers = (data: CustomFieldItems): CustomFieldItems => B3Request.graphqlB2B({
  query: getUsersQl(data),
})

export const addOrUpdateUsers = (data: CustomFieldItems): CustomFieldItems => B3Request.graphqlB2B({
  query: addOrUpdateUsersQl(data),
})

export const deleteUsers = (data: CustomFieldItems): CustomFieldItems => B3Request.graphqlB2B({
  query: deleteUsersQl(data),
})
