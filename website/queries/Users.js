export const createNewUser = `
    #graphql
    mutation createNewUser($data: create_directus_users_input!) {
        create_users_item(data: $data)
    }
`;

export const getCurrentUser = `
    #graphql
    query {
      users_me {
          email
          first_name
          last_name
      }
    }
`;

export const getUserList = `
    #graphql
    query {
      users {
        id
        email
      }
    }
`;

export const deleteUser = `
    #graphql
    mutation deleteUser($data: ID!) {
      delete_users_item(id: $data)
      {
        id
      }
    }
`;

export const getUser = `
    #graphql
    query getUser($email: String!) {
      users(filter: {email: {_eq: $email}}) {
        email
        id
        status
        provider
      }
    }
`;
