import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const dbClient = new DynamoDBClient({});

const annotationTable = process.env.TABLE_NAME;

const AnnotationType = {
    audio: 'audio',
    object: 'object',
    sketch: 'sketch'
}

export const handler = async (event, context) => {
    const body = JSON.parse(event.body);
    console.log(body)
    try {
        const username = event.requestContext.authorizer.claims['cognito:username'];
        const typeStr = Object.values(AnnotationType).includes(body.type) ? body.type : AnnotationType.object;
        console.log(typeStr)

        const positionStr = `${body.position.x},${body.position.y},${body.position.z}`;
        const orientationStr = `${body.orientation.x},${body.orientation.y},${body.orientation.z},${body.orientation.w}`;
        console.log(orientationStr)

        const params = {
            TableName: annotationTable,
            Item: {
                username: { S: username },
                annotationType: { S: typeStr },
                position: { S: positionStr },
                orientation: { S: orientationStr }
            }
        };
        console.log(params)
        await dbClient.send(new PutItemCommand(params));
    } catch (err) {
        console.log(err)
        return JsonResponse(500, "Error storing annotation data.");
    }

    return JsonResponse(200, "Annotation stored.");
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