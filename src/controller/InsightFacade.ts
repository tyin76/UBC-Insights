import Dataset from "../objects/Dataset";
import Section from "../objects/Section";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import {
	createDataFolder,
	getAllCachedDatasetIds,
	getKindFromId,
	getRowsFromId,
	removeDatasetFromDataCache,
	saveDatasetToDataCache,
} from "../objects/FileManagement";
import { getAllValidSections, parseSectionsData } from "../helperFunctions/QueryHandler";
const JSZip = require("jszip");

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private async getResultsJsonArray(content: string): Promise<any[]> {
		const zip = new JSZip();

		const zipData = await zip.loadAsync(content, { base64: true });

		const firstFileName = Object.keys(zipData.files)[0]; // Get the name of the first file

		if (firstFileName !== "courses/") {
			throw new InsightError("no folder 'courses' in zip file");
		}

		const resultsJson: any[] = []; // To store the results from each file as a Json

		const promises = Object.keys(zipData.files).map(async (path) => {
			if (path !== "courses/") {
				const fileData = await zipData.file(path)?.async("string"); // Read the file
				if (fileData) {
					try {
						const resultJson = JSON.parse(fileData); // Parse the JSON string into resultsJson Object
						resultsJson.push(resultJson); // Store the object in the resultsJson
					} catch (_error) {
						throw new InsightError("Invalid json");
					}
				} else {
					throw new InsightError("Invalid json, path not found for some reason");
				}
			}
		});

		// wait for all promises to finish
		await Promise.all(promises);
		return resultsJson;
	}

	private turnResultJsonToSectionArray(sectionJsonArray: any[]): Section[] {
		const sectionArray: Section[] = [];

		for (const section of sectionJsonArray) {
			const newSection = new Section(
				section.id,
				section.Course,
				section.Title,
				section.Professor,
				section.Subject,
				section.Year,
				section.Avg,
				section.Pass,
				section.Fail,
				section.Audit,
				section.Section
			);

			sectionArray.push(newSection);
		}

		return sectionArray;
	}

	private turnResultJsonArrayToSectionArray(resultJsonArray: any[]): Section[] {
		const sectionArray: Section[] = [];

		for (const resultJson of resultJsonArray) {
			const { result } = resultJson;
			sectionArray.push(...this.turnResultJsonToSectionArray(result));
		}

		return sectionArray;
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// jsonContents now contains all the parsed JSON objects from the files

		if (id === null || id.trim() === "" || typeof id !== "string" || id.includes("_")) {
			throw new InsightError("Invalid id");
		}

		if (kind === null || kind === undefined) {
			throw new InsightError("Invalid InsightDatasetKind, its either null or undefined");
		}

		if (content === null || content === undefined) {
			throw new InsightError("Invalid content, its either null or undefined");
		}

		const idsThatExistInCacheSoFar = await getAllCachedDatasetIds();

		if (idsThatExistInCacheSoFar.includes(id)) {
			throw new InsightError("id already exists");
		}

		await createDataFolder();

		const resultJsonArray: any[] = await this.getResultsJsonArray(content);

		const sectionArray = this.turnResultJsonArrayToSectionArray(resultJsonArray);

		const newDataset = new Dataset(sectionArray);

		if (sectionArray.length === 0) {
			throw new InsightError("Invalid dataset, no sections");
		}

		await saveDatasetToDataCache(id, newDataset, kind);

		return await getAllCachedDatasetIds();
	}

	public async removeDataset(id: string): Promise<string> {
		const regex = /^[^_]+$/;

		// checks if id is valid, otherwise throws error
		if (!regex.test(id) || id === null || id.trim() === "" || typeof id !== "string" || id.includes("_")) {
			throw new InsightError("Invalid id (removeDataset)");
		}

		const idsThatExistInCacheSoFar = await getAllCachedDatasetIds();

		if (!idsThatExistInCacheSoFar.includes(id)) {
			throw new NotFoundError("ID submitted is not found (removeDataset)");
		}

		await removeDatasetFromDataCache(id);
		return id;
	}

	// Reminder that query will use keys from the dataset
	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// gets all sections
		const sections: Section[] = await getAllValidSections(query);
		const insightResults: InsightResult[] = parseSectionsData(sections, query);
		return insightResults;
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		const ids = await getAllCachedDatasetIds();

		// Create an array of promises for each dataset
		const promises = ids.map(async (id) => {
			const kind = await getKindFromId(id); // Get the kind of dataset
			const numRows = await getRowsFromId(id); // Get the number of rows in the dataset

			// Construct the object
			return {
				id: id,
				kind: kind,
				numRows: numRows,
			} as InsightDataset; // Type assertion
		});

		// Wait for all promises to resolve and return the array
		const datasets = await Promise.all(promises);
		return datasets; // Return the resolved datasets
	}
}
