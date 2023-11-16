import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';

const dbClient = new DynamoDBClient({});

const annotationTable = process.env.TABLE_NAME;

export const getUserAnnotations = async (username) => {
    let annotations = [];
    let lastEvaluatedKey = undefined;

    try {
        do {
            const params = {
                TableName: annotationTable,
                KeyConditionExpression: 'username = :username',
                ExpressionAttributeValues: {
                    ':username': { S: username }
                },
                ExclusiveStartKey: lastEvaluatedKey
            };
            console.log(params);

            const response = await dbClient.send(new QueryCommand(params));
            console.log(response);
            annotations = annotations.concat(response.Items.map(item => {
                return {
                    username: item.username.S,
                    position: parseVector3(item.position.S),
                    orientation: parseVector4(item.orientation.S),
                    type: item.type.S
                };
            }));
            lastEvaluatedKey = response.LastEvaluatedKey;
        } while (lastEvaluatedKey);
    } catch (err) {
        console.log(err);
        return JsonResponse(500, "Error getting annotation info.");
    }

    return annotations;
};

function parseVector3(vectorStr) {
    const [x, y, z] = vectorStr.split(',').map(Number);
    return { x, y, z };
}

function parseVector4(vectorStr) {
    const [x, y, z, w] = vectorStr.split(',').map(Number);
    return { x, y, z, w };
}

export const handler = async (event, context) => {
    try {
        const username = event.requestContext.authorizer.claims['cognito:username'];
        console.log(event);

        // Call the function to get user annotations
        const annotations = await getUserAnnotations(username);
        console.log(annotations);

        // Format the response
        const response = JsonResponse(200, annotations);

        return response;
    } catch (err) {
        console.log(err);
        return JsonResponse(500, "Error getting player info.");
    }
};

const JsonResponse = (statusCode, body, mime = 'application/json') => {
    let response = {};
    try {
        response = {
            'statusCode': statusCode,
            'headers': {
                'Content-Type': mime,
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET, PUT'
            },
            'body': JSON.stringify(body)
        }
        return response;
    } catch (error) {
        console.log(error);
        response = {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': "Check CloudWatch Logs for Response Error"
        }
        return response
    }
}