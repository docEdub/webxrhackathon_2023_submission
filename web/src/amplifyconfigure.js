const amplifyConfig = {
  Auth: {
    // REQUIRED - Amazon Cognito Identity Pool ID
    identityPoolId: 'us-west-2:442a3e2d-e58c-4d6a-a2f6-0b37c9e40f41',

    // REQUIRED - Amazon Cognito Region
    region: 'US-WEST-2',

    // REQUIRED- Amazon Cognito User Pool ID
    userPoolId: 'us-west-2_c7ttc3Jrr',

    userPoolWebClientId: '6icdoh08mmjnb7rj80ggdl1thh',

    // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
    mandatorySignIn: true,
  },
  Api: {
    url: 'https://2ksuplvix6.execute-api.us-west-2.amazonaws.com/dev/'
  }
};

export default amplifyConfig;