import * as cdk from 'aws-cdk-lib';
import * as helpers from '../components/helperScripts';
import * as iam from 'aws-cdk-lib/aws-iam'
import { S3Bucket } from '../components/s3';
import {  LambdaStack } from '../components/lambda';
import { DDBTable } from '../components/ddb';
import { CognitoStack } from '../components/cognito';
import { restGatewayNestedStack } from '../components/apigateway';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import { BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { WebSiteDeployment } from '../components/webSiteDistribution';

export class MainStack extends cdk.Stack {
  public mainStack: Main
  constructor(app: cdk.App, id: string, props?: cdk.StackProps) {
    super(app, id, props);
    const contextValues = {
    };
    this.mainStack = new Main(this, contextValues);
  }
}

export class Main {
  constructor(scope: cdk.Stack, contextValues: any) {
    //Make S3 Bucket
    const storageBucket = new S3Bucket(scope, "StorageBucket", cdk.RemovalPolicy.DESTROY);

    //Lambda layer
    const storageEnvs = {
      BUCKET_NAME: storageBucket.bucketName
    };

    //DynamoDB Database
    const userAnnotationDatabase = new DDBTable(scope, "UserAnnotationDatabase",
        "username", "annotationType", BillingMode.PAY_PER_REQUEST, cdk.RemovalPolicy.DESTROY);

    const databaseEnvs = {
      TABLE_NAME: userAnnotationDatabase.tableName
    }

    //Make Nested Lambda Stack(s)
    const getAssetLambda = new LambdaStack(scope, "getAssetLambda", cdk.aws_lambda.Runtime.NODEJS_18_X,
     '../lambdaScripts/getAsset', 'handler', cdk.Duration.minutes(5), 512, 512, storageEnvs);
    const putAssetLambda = new LambdaStack(scope, "putAssetLambda", cdk.aws_lambda.Runtime.NODEJS_18_X,
    '../lambdaScripts/putAsset', 'handler', cdk.Duration.minutes(5), 512, 512, storageEnvs);
    const getAllAssetsLambda = new LambdaStack(scope, "getAllAssetsLambda", cdk.aws_lambda.Runtime.NODEJS_18_X,
    '../lambdaScripts/getAllAssets', 'handler', cdk.Duration.minutes(5), 512, 512, storageEnvs);

    //Grant Lambda functions read/write access to S3 bucket
    storageBucket.grantRead(getAssetLambda.lambdaFunction);
    storageBucket.grantReadWrite(putAssetLambda.lambdaFunction);
    storageBucket.grantReadWrite(getAllAssetsLambda.lambdaFunction);

    const getUserAnnotationsLambda = new LambdaStack(scope, "getUserAnnotationsLambda", cdk.aws_lambda.Runtime.NODEJS_18_X,
        '../lambdaScripts/getUserAnnotations', 'handler', cdk.Duration.minutes(5), 512, 512, databaseEnvs);
    const putUserAnnotationLambda = new LambdaStack(scope, "putUserAnnotationLambda", cdk.aws_lambda.Runtime.NODEJS_18_X,
        '../lambdaScripts/putUserAnnotation', 'handler', cdk.Duration.minutes(5), 512, 512, databaseEnvs);
    const getAllAnnotationsLambda = new LambdaStack(scope, "getAllAnnotationsLambda", cdk.aws_lambda.Runtime.NODEJS_18_X,
        '../lambdaScripts/getAllAnnotations', 'handler', cdk.Duration.minutes(5), 512, 512, databaseEnvs);

    //Grant Lambda functions read/write access to database
    userAnnotationDatabase.grantReadData(getUserAnnotationsLambda.lambdaFunction);
    userAnnotationDatabase.grantReadWriteData(putUserAnnotationLambda.lambdaFunction);
    userAnnotationDatabase.grantReadWriteData(getAllAnnotationsLambda.lambdaFunction);

    const indexArn = `arn:aws:dynamodb:${userAnnotationDatabase.env.region}:${userAnnotationDatabase.env.account}:table` +
        `/${userAnnotationDatabase.tableName}/index/annotationType`;

    getUserAnnotationsLambda.lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
        actions: ["dynamodb:Query"],
        resources: [indexArn],
    }));


    //Build Cognito Stack
    const cognitoStack = new CognitoStack(scope, "auth", true, true);
  
    //Build API Gateway
    const apiGateway = new restGatewayNestedStack(scope, "gateway", "Main Stack Gateway", "dev").gateway;
    const apiAuthorizer = apiGateway.AddCognitoAuthorizer(scope, "API_Authorizer", [cognitoStack.userPool])

    apiGateway.AddMethodIntegration(getAssetLambda.MethodIntegration(), "assets", "GET", apiAuthorizer);
    apiGateway.AddMethodIntegration(putAssetLambda.MethodIntegration(), "assets", "PUT", apiAuthorizer);
    apiGateway.AddMethodIntegration(getAllAssetsLambda.MethodIntegration(), "assets/all", "GET", apiAuthorizer);

    apiGateway.AddMethodIntegration(getUserAnnotationsLambda.MethodIntegration(), "annotation", "GET", apiAuthorizer);
    apiGateway.AddMethodIntegration(putUserAnnotationLambda.MethodIntegration(), "annotation", "PUT", apiAuthorizer);
    apiGateway.AddMethodIntegration(getAllAnnotationsLambda.MethodIntegration(), "annotations/all", "GET", apiAuthorizer);

    //Upload Website
    const website = new WebSiteDeployment(scope, "webDeployment", '../../web/dist', 'index.html', apiGateway, storageBucket);
     const configJson = {
         ...storageBucket.ExportConfig(),
         ...cognitoStack.ExportConfig(),
         ...apiGateway.ExportConfig(),
         ...website.ExportConfig()
    }

    helpers.OutputVariable(scope, "Params", configJson, "Configuration")
  }
}
