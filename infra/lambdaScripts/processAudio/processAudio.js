import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";

const s3Client = new S3Client({});
const transcribeClient = new TranscribeClient({});

async function fetchTranscription(resultLocation) {
    try {
        const response = await fetch(resultLocation);
        const transcriptionResult = await response.json();

        // Extract the transcribed text
        const text = transcriptionResult.results.transcripts[0].transcript;

        // You can now use `serializedText` as needed
        console.log(text);

        return text; // Return the serialized text if needed elsewhere
    } catch (error) {
        console.error('Error fetching transcription result:', error);
        throw error;
    }
}

export const handler = async (event) => {
    try {
        for (const record of event.Records) {
            if (record.s3.object.key.endsWith('.webm')) {
                const transcriptionJobName = `Transcription_${Date.now()}`;
                const fileUri = `s3://${record.s3.bucket.name}/${record.s3.object.key}`;

                // Start Transcription Job
                await transcribeClient.send(new StartTranscriptionJobCommand({
                    TranscriptionJobName: transcriptionJobName,
                    Media: { MediaFileUri: fileUri },
                    MediaFormat: 'webm',
                    LanguageCode: 'en-US'
                }));

                // Wait for Transcription Job to Complete
                let status, data;
                do {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    data = await transcribeClient.send(new GetTranscriptionJobCommand({ TranscriptionJobName: transcriptionJobName }));
                    status = data.TranscriptionJob.TranscriptionJobStatus;
                } while (status === 'IN_PROGRESS');

                // Fetch Transcription Result
                if (status === 'COMPLETED') {
                    const resultLocation = data.TranscriptionJob.Transcript.TranscriptFileUri;
                    const text = await fetchTranscription(resultLocation);

                    // Assuming the response is a readable stream
                    const textKey = record.s3.object.key.replace('.webm', '.txt');

                    await s3Client.send(new PutObjectCommand({
                        Bucket: record.s3.bucket.name,
                        Key: textKey,
                        Body: text
                    }));
                }
            }
        }
    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
};