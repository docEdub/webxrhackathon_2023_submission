const amplifyConfig = {
  Auth: {
    // REQUIRED - Amazon Cognito Identity Pool ID
    identityPoolId: 'us-east-1:c7065197-ea63-4956-ac62-1b2ac91bab82',
    
    // REQUIRED - Amazon Cognito Region
    region: 'US-EAST-1',
    
    // REQUIRED- Amazon Cognito User Pool ID
    userPoolId: 'us-east-1_OU59uADnu',

    userPoolWebClientId: '14fd6lm16lg7sob6v8fihnr2in',

    // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
    mandatorySignIn: true,
  },
  Api: {
    url: 'https://dyu2c7pal5.execute-api.us-east-1.amazonaws.com/dev/'
  }
};

export default amplifyConfig;


//WorkshopThree.APIRestURL = "https://dyu2c7pal5.execute-api.us-east-1.amazonaws.com/dev/"
//WorkshopThree.Params = {"Storage":{"AWSS3":{"bucket":"workshopthree-storagebucket19db2ff8-odcfb3kjn95l"}},"Auth":{"identityPoolId":"us-east-1:c7065197-ea63-4956-ac62-1b2ac91bab82","region":"us-east-1","userPoolId":"us-east-1_OU59uADnu","userPoolWebClientId":"14fd6lm16lg7sob6v8fihnr2in","mandatorySignIn":true},"API":{"endpoints":[{"name":"gateway_G","endpoint":"https://dyu2c7pal5.execute-api.us-east-1.amazonaws.com/dev/","region":"us-east-1"}]},"CloudFront":{"domainName":"d1h8mwg3moqacw.cloudfront.net"}}
//WorkshopThree.gatewayGEndpoint5D1E33B9 = https://dyu2c7pal5.execute-api.us-east-1.amazonaws.com/dev/
//Stack ARN:
//arn:aws:cloudformation:us-east-1:455590397074:stack/WorkshopThree/8385c360-83cd-11ee-9998-0e60d877363d
