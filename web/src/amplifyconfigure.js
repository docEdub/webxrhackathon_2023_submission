const amplifyConfig = {
  Auth: {
    // REQUIRED - Amazon Cognito Identity Pool ID
    identityPoolId: 'us-west-2:9b26e79a-4e85-404f-998d-93c16e4e1dbb',

    // REQUIRED - Amazon Cognito Region
    region: 'US-WEST-2',

    // REQUIRED- Amazon Cognito User Pool ID
    userPoolId: 'us-west-2_vs9V1Ui7E',

    userPoolWebClientId: '7a1ekck9a9tdv9gikrurqj0lp5',

    // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
    mandatorySignIn: true,
  },
  Api: {
    url: 'https://uog6i450kl.execute-api.us-west-2.amazonaws.com/dev/'
  }
};

export default amplifyConfig;