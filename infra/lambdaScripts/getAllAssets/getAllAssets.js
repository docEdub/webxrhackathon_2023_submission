import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({});
const bucketName = process.env.BUCKET_NAME;

const getPresignedUrl = async (key, expires) => {
    try {
        let expirationDate = Date.now();
        expirationDate += expires ? expires * 1000 : 900 * 1000; // default is 15 minutes
        expirationDate = new Date(expirationDate);

        const params = {
            Bucket: bucketName,
            Key: key,
            ResponseExpires: expirationDate
        };

        const command = new GetObjectCommand(params);
        const signedUrl = await getSignedUrl(client, command, { expiresIn: expires ? expires : 3600 });

        return signedUrl;

    } catch (error) {
        throw new Error(`Error generating pre-signed URL for key ${key}: ${error}`);
    }
};

const extractUsername = (key) => {
    const parts = key.split('/');
    return parts.length > 1 ? parts[0] : 'unknown';
};

const listAndGenerateUrls = async (assetKey, expires) => {
    try {
        const listParams = {
            Bucket: bucketName,
            Prefix: ''
        };
        const command = new ListObjectsV2Command(listParams);
        const { Contents } = await client.send(command);

        const matchingFiles = Contents.filter(item => item.Key.includes(assetKey));
        const urls = await Promise.all(matchingFiles.map(async (file) => {
            const url = await getPresignedUrl(file.Key, expires);
            const username = extractUsername(file.Key);
            return { username, url };
        }));

        return urls;
    } catch (error) {
        throw new Error(`Error listing objects in bucket ${bucketName}: ${error}`);
    }
};

const jsonResponse = (statusCode, body) => {
    return {
        'statusCode': statusCode,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            "Access-Control-Allow-Credentials": true,
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
        },
        'body': JSON.stringify(body)
    };
};

export const handler = async (event) => {
    try {
        const assetKey = event.queryStringParameters.assetKey;
        const expires = event.queryStringParameters.expires;

        if (!assetKey) {
            return jsonResponse(400, { message: "Asset key parameter is required" });
        }

        const urls = await listAndGenerateUrls(assetKey, expires);
        return jsonResponse(200, { "pre_signed_urls": urls });

    } catch (error) {
        console.error(error);
        return jsonResponse(500, { "message": error.toString() });
    }
};
