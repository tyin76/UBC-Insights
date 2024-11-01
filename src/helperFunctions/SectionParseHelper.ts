import { InsightError, InsightResult } from "../controller/IInsightFacade";
import Section from "../objects/Section";
import { getSectionValueFromConditionKey } from "./SectionsFilterHelper";
import { recursiveStringNumCompare } from "./SortHelper";
import { doesQueryContainTransformations } from "./TransformationsValidationHelper";

export async function parseSectionsData(
	sections: Section[],
	query: any,
	datasetName: string
): Promise<InsightResult[]> {
	const insightResultsToReturn: InsightResult[] = [];

	// This sorts based on the parameter provided to ORDER
	if (query.OPTIONS.ORDER !== null && query.OPTIONS.ORDER !== undefined && !doesQueryContainTransformations(query)) {
		if (typeof query.OPTIONS.ORDER === "string") {
			sortSectionUsingKey([query.OPTIONS.ORDER.split("_")[1]], sections);
		} else {
			sortSectionUsingKey(
				query.OPTIONS.ORDER.keys.map((key: string) => key.split("_")[1]),
				sections,
				query.OPTIONS.ORDER.dir
			);
		}
	}

	await Promise.all(getPromises(sections, query, datasetName, insightResultsToReturn));

	return insightResultsToReturn;
}

function getPromises(
	sections: Section[],
	query: any,
	datasetName: string,
	insightResultsToReturn: InsightResult[]
): Promise<void>[] {
	return sections.map(async (section) => {
		const insightResult: InsightResult = {};

		let keysToKeep = query.OPTIONS.COLUMNS;

		if (doesQueryContainTransformations(query)) {
			keysToKeep = await getAllSectionKeys(datasetName);
		}

		for (const key of keysToKeep) {
			const datasetAndVariable: string[] = key.split("_");
			const variable = datasetAndVariable[1];

			if (!variable && doesQueryContainTransformations(query)) {
				// means that if variable is undefined, then likely transformations is present and a custom field is in the columns
				continue;
			}
			insightResult[key] = getSectionValueFromConditionKey(variable, section);
		}

		insightResultsToReturn.push(insightResult);
	});
}

function sortSectionUsingKey(conditionKeys: string[], sectionsToSort: Section[], direction = "UP"): void {
	sectionsToSort.sort((x, y) => recursiveStringNumCompare(conditionKeys, x, y));

	if (direction === "DOWN") {
		sectionsToSort.reverse();
	} else if (direction !== "UP") {
		throw new InsightError("Invalid dir key");
	}
}

async function getAllSectionKeys(datasetName: string): Promise<string[]> {
	return [
		`${datasetName}_uuid`,
		`${datasetName}_id`,
		`${datasetName}_title`,
		`${datasetName}_instructor`,
		`${datasetName}_dept`,
		`${datasetName}_year`,
		`${datasetName}_avg`,
		`${datasetName}_pass`,
		`${datasetName}_fail`,
		`${datasetName}_audit`,
	];
}
