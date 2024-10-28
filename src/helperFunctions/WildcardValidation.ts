import { InsightError } from "../controller/IInsightFacade";

export function checkAstericksPlacement(toCheck: string): void {
	if (!toCheck.includes("*")) {
		return;
	}
	const numberOfAstericks = getNumberOfAstericksInString(toCheck);
	const numberOfAstericksAllowed = 2;
	validateTheresOnlyOneAsterisk(numberOfAstericks, numberOfAstericksAllowed);
	validateNoAstericksInMiddle(numberOfAstericks, toCheck);
	validateAstericksAtBoundaries(numberOfAstericks, numberOfAstericksAllowed, toCheck);
}

function getNumberOfAstericksInString(string: string): number {
	return string.split("*").length - 1;
}

function validateAstericksAtBoundaries(numberOfAsterisks: number, numAstericksAllowed: number, toCheck: string): void {
	if (
		numberOfAsterisks === numAstericksAllowed &&
		(toCheck.charAt(0) !== "*" || toCheck.charAt(toCheck.length - 1) !== "*")
	) {
		throw new InsightError("Asterisks must be at both the start and end of the string if there are");
	}
}

function validateNoAstericksInMiddle(numberOfAsterisks: number, toCheck: string): void {
	if (numberOfAsterisks === 1 && toCheck.charAt(0) !== "*" && toCheck.charAt(toCheck.length - 1) !== "*") {
		throw new InsightError("Asterisks cannot be in the middle");
	}
}

function validateTheresOnlyOneAsterisk(numberOfAsterisks: number, numberOfAsterisksAllowed: number): void {
	if (numberOfAsterisks > numberOfAsterisksAllowed) {
		throw new InsightError("You cannot have more than 2 asterisks");
	}
}
