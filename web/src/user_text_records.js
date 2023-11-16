
import { fetchAllTextFiles } from "./cloud";

let userTextRecords = [];

export const updateUserTextRecords = async () => {
    userTextRecords = await fetchAllTextFiles();
    console.log(userTextRecords);
}

export const removeUserTextRecord = async (username) => {
    if (userTextRecords.length === 0) {
        await updateUserTextRecords();
    }

    const index = userTextRecords.findIndex(record => record.username === username);
    if (index === -1) {
        return;
    }

    userTextRecords.splice(index, 1);
}

export const getUserText = async (username) => {
    if (userTextRecords.length === 0) {
        await updateUserTextRecords();
    }

    const record = userTextRecords.find(record => record.username === username);
    if (!record) {
        return null;
    }

    const text = record.text;
    console.log("User text: ", text);

    return text;
}
