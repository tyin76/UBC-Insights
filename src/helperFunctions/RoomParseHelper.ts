import { InsightError, InsightResult } from "../controller/IInsightFacade";
import Room from "../objects/Room";
import { getRoomValueFromConditionKey } from "./RoomsFilterHelper";
import { recursiveStringNumCompare } from "./SortHelper";
import { doesQueryContainTransformations } from "./TransformationsValidationHelper";
import { dangerouslyGetDatasetNameFromQuery } from "./WhereDatasetExtractorAndRefsValidation";

export function parseRoomsData(rooms: Room[], query: any): InsightResult[] {
	const insightResultsToReturn: InsightResult[] = [];

	// This sorts based on the parameter provided to ORDER
	if (query.OPTIONS.ORDER !== null && query.OPTIONS.ORDER !== undefined && !doesQueryContainTransformations(query)) {
		if (typeof query.OPTIONS.ORDER === "string") {
			sortRoomUsingKey([query.OPTIONS.ORDER.split("_")[1]], rooms);
		} else {
			sortRoomUsingKey(
				query.OPTIONS.ORDER.keys.map((key: string) => key.split("_")[1]),
				rooms,
				query.OPTIONS.ORDER.dir
			);
		}
	}

	for (const room of rooms) {
		const insightResult: InsightResult = {};

		let keysToKeep = query.OPTIONS.COLUMNS;

		if (doesQueryContainTransformations(query)) {
			keysToKeep = getAllRoomKeys(query);
		}

		for (const key of keysToKeep) {
			const datasetAndVariable: string[] = key.split("_");
			const variable = datasetAndVariable[1];

			if (!variable && doesQueryContainTransformations(query)) {
				// means that if variable is undefined, then likely transformations is present and a custom field is in the columns
				continue;
			}

			insightResult[key] = getRoomValueFromConditionKey(variable, room);
		}

		insightResultsToReturn.push(insightResult);
	}

	return insightResultsToReturn;
}

function sortRoomUsingKey(conditionKeys: string[], roomsToSort: Room[], direction = "UP"): void {
	roomsToSort.sort((x, y) => recursiveStringNumCompare(conditionKeys, x, y));

	if (direction === "DOWN") {
		roomsToSort.reverse();
	} else if (direction !== "UP") {
		throw new InsightError("Invalid dir key");
	}
}

function getAllRoomKeys(query: any): string[] {
	const datasetName = dangerouslyGetDatasetNameFromQuery(query);
	return [
		`${datasetName}_fullname`,
		`${datasetName}_shortname`,
		`${datasetName}_number`,
		`${datasetName}_name`,
		`${datasetName}_address`,
		`${datasetName}_lat`,
		`${datasetName}_lon`,
		`${datasetName}_seats`,
		`${datasetName}_type`,
		`${datasetName}_furniture`,
		`${datasetName}_href`,
	];
}
