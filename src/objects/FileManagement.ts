import path from "path";
import * as fs from "fs";
import { InsightDatasetKind, InsightError } from "../controller/IInsightFacade";
import Dataset from "./Dataset";

const directoryPath = path.join(__dirname, "..", "..", "data"); // Moves up two level to project file root
const kindKeyword = "kind";
const rowsKeyword = "rows";

export async function createDataFolder(): Promise<void> {
	try {
		await fs.promises.mkdir(directoryPath);
		//console.log('Folder "data" created.');
	} catch (err) {
		if (err instanceof Error && (err as NodeJS.ErrnoException).code) {
			const errorCode = (err as NodeJS.ErrnoException).code;
			if (errorCode === "EEXIST") {
				// Used ChatGPT here to figure out if folder already exists
				//console.log('Folder "data" already exists.');
			} else {
				throw new InsightError("Error making data folder: " + (err as Error).message);
			}
		} else {
			throw new InsightError("Error making data folder: " + (err as Error).message);
		}
	}
}

export async function saveDatasetToDataCache(id: string, dataset: Dataset, kind: InsightDatasetKind): Promise<void> {
	const indentation = 2;
	let filePath = path.join(directoryPath, `${id}.json`);
	const jsonContent = JSON.stringify(dataset.toJSON(), null, indentation); // Convert to JSON into a string so we can save to file
	await fs.promises.writeFile(filePath, jsonContent); // writing the json file

	// Now we are storing the kind of the dataset it is storing it in a file
	filePath = path.join(directoryPath, `${id}` + kindKeyword);
	await fs.promises.writeFile(filePath, kind); // writing the json file

	// Now we are storing the sections/rows of the dataset in a file
	filePath = path.join(directoryPath, `${id}` + rowsKeyword);
	await fs.promises.writeFile(filePath, dataset.getSections().length + ""); // writing the json file
}

export async function removeDatasetFromDataCache(id: string): Promise<void> {
	let filePath = path.join(directoryPath, `${id}.json`);

	try {
		await fs.promises.unlink(filePath); // remove the file from the cache

		// delete idKind
		filePath = path.join(directoryPath, `${id}` + kindKeyword);
		await fs.promises.unlink(filePath); // writing the json file

		// delete idRows
		filePath = path.join(directoryPath, `${id}` + rowsKeyword);
		await fs.promises.unlink(filePath); // writing the json file
	} catch (err) {
		const errorMessage = (err as Error).message;
		throw new InsightError("Error: " + errorMessage);
	}
}

export async function getAllCachedDatasetIds(): Promise<string[]> {
	const idArray: string[] = [];
	const splitArrLength = 2;

	await createDataFolder(); // create data folder just in case

	try {
		const datasetFileNames = await fs.promises.readdir(directoryPath);

		// Add all file (dataset) names into the array that we return
		for (const datasetName of datasetFileNames) {
			const splitNameArr = datasetName.split("."); // Here we split on the period so "dataset.json" turns into [dataset, json], then we just keep the name which is at index 0

			if (splitNameArr.length === splitArrLength && splitNameArr[1] === "json") {
				// make sure we only add the id names gotten from jsons (because we have other files that store the number of rows and also the kind of dataset)
				idArray.push(splitNameArr[0]); // Here we split on the period so "dataset.json" turns into [dataset, json], then we just keep the name which is at index 0
			}
		}
	} catch (err) {
		const errorMessage = (err as Error).message;
		throw new InsightError("Error: " + errorMessage);
	}
	return idArray;
}

export async function getKindFromId(id: string): Promise<InsightDatasetKind> {
	try {
		const filePath = path.join(directoryPath, `${id}` + kindKeyword);

		// Read the contents of the file
		const content = await fs.promises.readFile(filePath, "utf-8");

		return content as unknown as InsightDatasetKind;
	} catch (err) {
		const errorMessage = (err as Error).message;
		throw new InsightError("Error: " + errorMessage);
	}
}

export async function getRowsFromId(id: string): Promise<number> {
	try {
		const filePath = path.join(directoryPath, `${id}` + rowsKeyword);

		// Read the contents of the file
		const content = await fs.promises.readFile(filePath, "utf-8");

		return Number(content);
	} catch (err) {
		const errorMessage = (err as Error).message;
		throw new InsightError("Error: " + errorMessage);
	}
}
