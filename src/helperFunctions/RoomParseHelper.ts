import { InsightError, InsightResult } from "../controller/IInsightFacade";
import Room from "../objects/Room";
import { getRoomValueFromConditionKey } from "./RoomsFilterHelper";
import { recursiveStringNumCompare } from "./SortHelper";

export function parseRoomsData(rooms: Room[], query: any): InsightResult[] {
	const insightResultsToReturn: InsightResult[] = [];

	// This sorts based on the parameter provided to ORDER
	if (query.OPTIONS.ORDER !== null && query.OPTIONS.ORDER !== undefined) {
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

		for (const key of query.OPTIONS.COLUMNS) {
			const datasetAndVariable: string[] = key.split("_");
			const variable = datasetAndVariable[1];

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
