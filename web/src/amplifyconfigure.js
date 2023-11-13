const amplifyConfig = {
  Auth: {
    // REQUIRED - Amazon Cognito Identity Pool ID
    identityPoolId: 'us-east-1:0a3e07bc-7b42-4e56-818c-d1d9b707734f',
    
    // REQUIRED - Amazon Cognito Region
    region: 'US-EAST-1',
    
    // REQUIRED- Amazon Cognito User Pool ID
    userPoolId: 'us-east-1_Cm2MADIxV',

    userPoolWebClientId: '3ikcgon8rai3dfqom8gftqt11h',

    // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
    mandatorySignIn: true,
  },
  Api: {
    url: 'https://p3t6osp0o1.execute-api.us-east-1.amazonaws.com/dev/'
  }
};

export default amplifyConfig;