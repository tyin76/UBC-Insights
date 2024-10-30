import { InsightResult } from "../controller/IInsightFacade";
import Room from "../objects/Room";
import { getRoomValueFromConditionKey } from "./RoomsFilterHelper";

export function parseRoomsData(rooms: Room[], query: any): InsightResult[] {
	const insightResultsToReturn: InsightResult[] = [];

	// This sorts based on the parameter provided to ORDER
	if (query.OPTIONS.ORDER !== null && query.OPTIONS.ORDER !== undefined) {
		sortRoomUsingKey(query.OPTIONS.ORDER.split("_")[1], rooms);
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

function sortRoomUsingKey(conditionKey: string, roomsToSort: Room[]): void {
	switch (conditionKey) {
		case "fullname":
			roomsToSort.sort((x, y) => x.getFullName().localeCompare(y.getFullName()));
			break;
		case "shortname":
			roomsToSort.sort((x, y) => x.getShortName().localeCompare(y.getShortName()));
			break;
		case "number":
			roomsToSort.sort((x, y) => x.getNumber().localeCompare(y.getNumber()));
			break;
		case "name":
			roomsToSort.sort((x, y) => x.getName().localeCompare(y.getName()));
			break;
		case "address":
			roomsToSort.sort((x, y) => x.getAddress().localeCompare(y.getAddress()));
			break;
		case "lat":
			roomsToSort.sort((x, y) => x.getLat() - y.getLat());
			break;
		case "lon":
			roomsToSort.sort((x, y) => x.getLon() - y.getLon());
			break;
		case "seats":
			roomsToSort.sort((x, y) => x.getSeats() - y.getSeats());
			break;
		case "type":
			roomsToSort.sort((x, y) => x.getType().localeCompare(y.getType()));
			break;
		case "furniture":
			roomsToSort.sort((x, y) => x.getFurniture().localeCompare(y.getFurniture()));
			break;
        case "href":
            roomsToSort.sort((x, y) => x.getHref().localeCompare(y.getHref()));
            break;
	}
}