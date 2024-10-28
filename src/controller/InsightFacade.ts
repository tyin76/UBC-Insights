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
import {
	checkThatIdDoesNotAlreadyExistInCache,
	createSectionsDatasetFromContent,
	validateDatasetParameters,
} from "../helperFunctions/AddDatasetHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		validateDatasetParameters(id, content, kind);
		await checkThatIdDoesNotAlreadyExistInCache(id);
		await createDataFolder();

		const newDataset = await createSectionsDatasetFromContent(content);

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
