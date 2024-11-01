import Room from "../objects/Room";
import Section from "../objects/Section";
import { getRoomValueFromConditionKey } from "./RoomsFilterHelper";
import { getSectionValueFromConditionKey } from "./SectionsFilterHelper";

export function recursiveStringNumCompare(conditionKeys: string[], x: Room | Section, y: Room | Section): number {
	if (conditionKeys.length === 0) {
		return 0;
	}

	const errorCode = -3333;

	let xVal: number | string = errorCode;
	let yVal: number | string = errorCode;

	if (x instanceof Room && y instanceof Room) {
		xVal = getRoomValueFromConditionKey(conditionKeys[0], x);
		yVal = getRoomValueFromConditionKey(conditionKeys[0], y);
	} else if (x instanceof Section && y instanceof Section) {
		xVal = getSectionValueFromConditionKey(conditionKeys[0], x);
		yVal = getSectionValueFromConditionKey(conditionKeys[0], y);
	} else {
		throw new Error("Wrong use of recursive sort");
	}

	if (xVal === errorCode || yVal === errorCode) {
		throw new Error("Wrong use of recursive sort");
	}

	if (xVal > yVal) {
		return 1;
	} else if (xVal < yVal) {
		return -1;
	}

	return recursiveStringNumCompare(conditionKeys.slice(1), x, y);
}
