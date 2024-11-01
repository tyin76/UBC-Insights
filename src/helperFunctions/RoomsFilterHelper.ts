import { InsightError, ResultTooLargeError } from "../controller/IInsightFacade";
import Dataset from "../objects/Dataset";
import Room from "../objects/Room";
import { entityMatchesQueryRequirements, maxSections } from "./QueryHandler";

export function filterRoomDataset(datasetToQuery: Dataset, operator: any, operatorParameter: any): Room[] {
	// This will store all the rooms that we should return to be processed
	const roomsToReturn: Room[] = [];

	for (const room of datasetToQuery.getEntities() as Room[]) {
		if (entityMatchesQueryRequirements(operator, operatorParameter, room, datasetToQuery.getKind())) {
			roomsToReturn.push(room);

			if (roomsToReturn.length > maxSections) {
				throw new ResultTooLargeError("More than 5000 sections are going to be returned!");
			}
		}
	}

	return roomsToReturn;
}

export function getRoomValueFromConditionKey(conditionKey: string, roomToUse: Room): string | number {
	switch (conditionKey) {
		case "fullname":
			return roomToUse.getFullName();
		case "shortname":
			return roomToUse.getShortName();
		case "number":
			return roomToUse.getNumber();
		case "name":
			return roomToUse.getName();
		case "address":
			return roomToUse.getAddress();
		case "lat":
			return roomToUse.getLat();
		case "lon":
			return roomToUse.getLon();
		case "seats":
			return roomToUse.getSeats();
		case "type":
			return roomToUse.getType();
		case "furniture":
			return roomToUse.getFurniture();
		case "href":
			return roomToUse.getHref();
		default:
			throw new InsightError(`Unknown condition key: ${conditionKey}`);
	}
}
