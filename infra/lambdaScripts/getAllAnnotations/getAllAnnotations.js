import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const dbClient = new DynamoDBClient({});

const annotationTable = process.env.TABLE_NAME;

export const getAllAnnotations = async () => {
    let annotations = [];
    let lastEvaluatedKey = undefined;

    do {
        const params = {
            TableName: annotationTable,
            ExclusiveStartKey: lastEvaluatedKey
        };
        console.log(params);

        const response = await dbClient.send(new ScanCommand(params));
        console.log(response);
        annotations = annotations.concat(response.Items.map(item => {
            return {
                username: item.username.S,
                position: parseVector3(item.position.S),
                orientation: parseVector4(item.orientation.S),
                type: item.annotationType.S
            };
        }));
        lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

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
        // Call the function to get all annotations
        const annotations = await getAllAnnotations();

        // Format the response
        const response = JsonResponse(200, annotations);

        return response;
    } catch (err) {
        console.log(err);
        return JsonResponse(500, "Error getting annotation info.");
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