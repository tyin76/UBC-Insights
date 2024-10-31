import Decimal from "decimal.js";
import {InsightError, InsightResult } from "../controller/IInsightFacade";
import { isFieldValidRoomNumberField, isFieldValidRoomStringField } from "./RoomValidationHelper";
import { isFieldValidSectionNumberField, isFieldValidSectionStringField } from "./SectionValidationHelper";
import { recursiveInsightResultCompare } from "./InsightResultSortHelper";

export function transformEngine(insightResults: InsightResult[], query: any): InsightResult[] {
	if (insightResults.length === 0) {
		return [];
	}

	const transformInstructions = getTransformInstructions(query);

	const transformationInsightResults: { [key: string]: InsightResult } = {};

	if (transformInstructions.length === 0) {
		return groupOnly(transformationInsightResults, insightResults, query);
	}

	for (const instruction of transformInstructions) {
		transform(transformationInsightResults, insightResults, query, instruction[0], instruction[1], instruction[2]);
	}

	const filteredInsightResults = columnFilteredInsightResults(query, Object.values(transformationInsightResults))

	return sortInsightResults(query, filteredInsightResults);
}

function sortInsightResults(query: any, insightResults: InsightResult[]): InsightResult[] {
	if (query.OPTIONS.ORDER !== null && query.OPTIONS.ORDER !== undefined) {
		if (typeof query.OPTIONS.ORDER === "string") {
			sortInsightResultsUsingKey([query.OPTIONS.ORDER], insightResults);
		} else {
			sortInsightResultsUsingKey(
				query.OPTIONS.ORDER.keys,
				insightResults,
				query.OPTIONS.ORDER.dir
			);
		}
	}
	return insightResults;
}

function sortInsightResultsUsingKey(conditionKeys: string[], insightResultsToSort: InsightResult[], direction = "UP"): void {
	insightResultsToSort.sort((x, y) => recursiveInsightResultCompare(conditionKeys, x, y));

	if (direction === "DOWN") {
		insightResultsToSort.reverse();
	} else if (direction !== "UP") {
		throw new InsightError("Invalid dir key");
	}
}

function columnFilteredInsightResults(query: any, insightResults: InsightResult[]): InsightResult[] {
	const columns = query.OPTIONS.COLUMNS;

	const newInsightToReturn: InsightResult[] = [];

	for (const result of insightResults) {
		const newInsightResult: InsightResult = {};
		for (const key of Object.keys(result)) {
			if (columns.includes(key)) {
				newInsightResult[key] = result[key];
			}
		}
		newInsightToReturn.push(newInsightResult);
	}
	return newInsightToReturn;
}

function transform(
	transformationInsightResults: { [key: string]: InsightResult },
	insightResults: InsightResult[],
	query: any,
	customFieldName: string,
	transformationOperator: string,
	fieldToTransform: string
): InsightResult[] {
	switch (transformationOperator) {
		case "MAX":
			return getMaxForGroup(transformationInsightResults, insightResults, query, customFieldName, fieldToTransform);
		case "MIN":
			return getMinForGroup(transformationInsightResults, insightResults, query, customFieldName, fieldToTransform);
		case "AVG":
			return getAvgForGroup(transformationInsightResults, insightResults, query, customFieldName, fieldToTransform);
		case "SUM":
			return getSumForGroup(transformationInsightResults, insightResults, query, customFieldName, fieldToTransform);
		case "COUNT":
			return getCountForGroup(transformationInsightResults, insightResults, query, customFieldName, fieldToTransform);
	}
	throw new InsightError("Invalid transformation operator");
}

function groupOnly(	transformationInsightResults: { [key: string]: InsightResult },
	insightResults: InsightResult[],
	query: any,): InsightResult[]  {
	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	for (const result of insightResults) {
		let currGroupId: string = "";
		const insightResult: InsightResult = {};
		for (const field of fieldsToGroupBy) {
			currGroupId += result[field];
			insightResult[field] = result[field];
		}
	
		if (transformationInsightResults[currGroupId] === undefined) {
			transformationInsightResults[currGroupId] = insightResult;
		} 
	}
	return Object.values(transformationInsightResults);
}

function getTransformInstructions(query: any): string[][] {
	const toTransform = [];

	const apply = query.TRANSFORMATIONS.APPLY;

	// Use a for loop to iterate over each object in the data array
	for (let i = 0; i < apply.length; i++) {
		const item = apply[i]; // Get the current object

		const customFieldName = Object.keys(item)[0];
		const transformationOperator = Object.keys(item[customFieldName])[0];
		const fieldToTransform = item[customFieldName][transformationOperator];

		// Push the new array into the transformedArray
		toTransform.push([customFieldName, transformationOperator, fieldToTransform]);
	}
	return toTransform;
}

function getCountForGroup(
	transformationInsightResults: { [key: string]: InsightResult },
	insightResults: InsightResult[],
	query: any,
	customFieldName: string,
	fieldToCount: string
): InsightResult[] {
	const parsedField = fieldToCount.split("_")[1];

	if (
		!(
			isFieldValidRoomNumberField(parsedField) ||
			isFieldValidSectionNumberField(parsedField) ||
			isFieldValidRoomStringField(parsedField) ||
			isFieldValidSectionStringField(parsedField)
		)
	) {
		throw new InsightError("Field provided is of the wrong type for transformation");
	}

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	const countMap: { [key: string]: Set<number | string> } = {};

	for (const result of insightResults) {
		let currGroupId: string = "";
		const insightResult: InsightResult = {};
		for (const field of fieldsToGroupBy) {
			currGroupId += result[field];
			insightResult[field] = result[field];
		}
		if (countMap[currGroupId] === undefined) {
			countMap[currGroupId] = new Set();
			countMap[currGroupId].add(result[fieldToCount]);
		} else {
			countMap[currGroupId].add(result[fieldToCount]);
		}
		if (transformationInsightResults[currGroupId] === undefined) {
			transformationInsightResults[currGroupId] = insightResult;
		} 
		if (transformationInsightResults[currGroupId][customFieldName] === undefined) {
			transformationInsightResults[currGroupId][customFieldName] = 0;

		}
	}

	for (const key of Object.keys(countMap)) {
		transformationInsightResults[key][customFieldName] = countMap[key].size;
	}

	return Object.values(transformationInsightResults);
}

function getMinForGroup(
	transformationInsightResults: { [key: string]: InsightResult },
	insightResults: InsightResult[],
	query: any,
	customFieldName: string,
	fieldToFindMin: string
): InsightResult[] {
	checkIfFieldTypeOfNumber(fieldToFindMin);

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	for (const result of insightResults) {
		let currGroupId: string = "";
		const insightResult: InsightResult = {};
		for (const field of fieldsToGroupBy) {
			currGroupId += result[field];
			insightResult[field] = result[field];
		}
		
		if (transformationInsightResults[currGroupId] === undefined) {
			transformationInsightResults[currGroupId] = insightResult;
		} 
		if (transformationInsightResults[currGroupId][customFieldName] !== undefined) {
			const min = transformationInsightResults[currGroupId][customFieldName];
			const potentialMin = result[fieldToFindMin];
			transformationInsightResults[currGroupId][customFieldName] = Math.min(min as number, potentialMin as number);
		} else if (transformationInsightResults[currGroupId][customFieldName] === undefined) {
			transformationInsightResults[currGroupId][customFieldName] = result[fieldToFindMin] as number;
		}
	}

	return Object.values(transformationInsightResults);
}

function checkIfFieldTypeOfNumber(field: string): void {
	const parsedField = field.split("_")[1];

	if (isFieldValidRoomNumberField(parsedField) || isFieldValidSectionNumberField(parsedField)) {
		return;
	}

	throw new InsightError("Field provided is of the wrong type for transformation");
}

function getMaxForGroup(
	transformationInsightResults: { [key: string]: InsightResult },
	insightResults: InsightResult[],
	query: any,
	customFieldName: string,
	fieldToFindMax: string
): InsightResult[] {
	checkIfFieldTypeOfNumber(fieldToFindMax);

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	for (const result of insightResults) {
		let currGroupId: string = "";
		const insightResult: InsightResult = {};
		for (const field of fieldsToGroupBy) {
			currGroupId += result[field];
			insightResult[field] = result[field];
		}
		if (transformationInsightResults[currGroupId] === undefined) {
			transformationInsightResults[currGroupId] = insightResult;
		}
		 if (transformationInsightResults[currGroupId][customFieldName] !== undefined) {
			const max = transformationInsightResults[currGroupId][customFieldName];
			const potentialMax = result[fieldToFindMax];
			transformationInsightResults[currGroupId][customFieldName] = Math.max(max as number, potentialMax as number);
		} else if (transformationInsightResults[currGroupId][customFieldName] === undefined) {
			transformationInsightResults[currGroupId][customFieldName] = result[fieldToFindMax] as number;
		}
	}

	return Object.values(transformationInsightResults);
}

function getSumForGroup(
	transformationInsightResults: { [key: string]: InsightResult },
	insightResults: InsightResult[],
	query: any,
	customFieldName: string,
	fieldToSum: string
): InsightResult[] {
	checkIfFieldTypeOfNumber(fieldToSum);

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	const sumMap: { [key: string]: Decimal } = {};

	for (const result of insightResults) {
		let currGroupId: string = "";
		const insightResult: InsightResult = {};
		for (const field of fieldsToGroupBy) {
			currGroupId += result[field];
			insightResult[field] = result[field];
		}
		if (transformationInsightResults[currGroupId] === undefined) {
			transformationInsightResults[currGroupId] = insightResult;
		}
		if (sumMap[currGroupId] !== undefined){
			sumMap[currGroupId] = (sumMap[currGroupId] as Decimal).add(new Decimal(result[fieldToSum]));
		}else if (sumMap[currGroupId] === undefined) {
			sumMap[currGroupId] = new Decimal(result[fieldToSum]);
		}
	}

	for (const key of Object.keys(sumMap)) {
		transformationInsightResults[key][customFieldName] = Number(sumMap[key].toFixed(2));
	}

	return Object.values(transformationInsightResults);
}

function getAvgForGroup(
	transformationInsightResults: { [key: string]: InsightResult },
	insightResults: InsightResult[],
	query: any,
	customFieldName: string,
	fieldToAvg: string
): InsightResult[] {
	checkIfFieldTypeOfNumber(fieldToAvg);

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	const avgMap: { [key: string]: { [x: string]: Decimal | number } } = {};

	const rowsKeyword = "rows";
	const totalKeyword = "total";

	for (const result of insightResults) {
		let currGroupId: string = "";
		const insightResult: InsightResult = {};
		for (const field of fieldsToGroupBy) {
			currGroupId += result[field];
			insightResult[field] = result[field];
		}
		if (transformationInsightResults[currGroupId] === undefined) {
			transformationInsightResults[currGroupId] = insightResult;
		} 
		
		if (avgMap[currGroupId] !== undefined){
			avgMap[currGroupId][totalKeyword] = (avgMap[currGroupId][totalKeyword] as Decimal).add(
				new Decimal(result[fieldToAvg])
			);
			avgMap[currGroupId][rowsKeyword] = (avgMap[currGroupId][rowsKeyword] as number) + 1;
		} else if (avgMap[currGroupId] === undefined) {
			avgMap[currGroupId] = {};
			avgMap[currGroupId][rowsKeyword] = 1;
			avgMap[currGroupId][totalKeyword] = new Decimal(result[fieldToAvg]);
		}
	}

	for (const key of Object.keys(avgMap)) {
		const total = (avgMap[key][totalKeyword] as Decimal).toNumber();
		const rows = avgMap[key][rowsKeyword] as number;
		const avg = total / rows;
		transformationInsightResults[key][customFieldName] = Number(avg.toFixed(2));
	}

	return Object.values(transformationInsightResults);
}

// each group name will represent one object
function getGroups(insightResults: InsightResult[], query: any): (string | number)[][] {
	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);
	const groups: Set<string> = new Set();

	for (const result of insightResults) {
		const group: (string | number)[] = []; // Use an array to build the group

		for (const field of fieldsToGroupBy) {
			group.push(result[field]); // Push values into the group array
		}

		// Convert the array to a string to ensure uniqueness in the Set
		groups.add(JSON.stringify(group)); // Add the stringified array to the Set
	}

	// Convert the Set back to an array of arrays
	return Array.from(groups).map((item) => convertJsonToGroup(item));
}

function convertJsonToGroup(json: any): (string | number)[] {
	return JSON.parse(json) as (string | number)[];
}

function getFieldsToGroupBy(query: any): string[] {
	return query.TRANSFORMATIONS.GROUP;
}
