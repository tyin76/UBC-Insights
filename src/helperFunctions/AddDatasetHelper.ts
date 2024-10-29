import JSZip from "jszip";
import { InsightDatasetKind, InsightError } from "../controller/IInsightFacade";
import { getAllCachedDatasetIds } from "../objects/FileManagement";
import Section from "../objects/Section";
import Dataset from "../objects/Dataset";
import Room from "../objects/Room";
import { text } from "stream/consumers";

const parse5 = require("parse5");
//const fs = require("fs");

export function validateDatasetParameters(id: string, content: string, kind: InsightDatasetKind): void {
	if (id === null || id === undefined || id.trim() === "" || typeof id !== "string" || id.includes("_")) {
		throw new InsightError("Invalid id");
	}

	if (kind === null || kind === undefined) {
		throw new InsightError("Invalid InsightDatasetKind, its either null or undefined");
	}

	if (content === null || content === undefined) {
		throw new InsightError("Invalid content, its either null or undefined");
	}
}

export async function checkThatIdDoesNotAlreadyExistInCache(id: string): Promise<void> {
	const idsThatExistInCacheSoFar = await getAllCachedDatasetIds();

	if (idsThatExistInCacheSoFar.includes(id)) {
		throw new InsightError("id already exists");
	}
}

async function extractCourseResultsFromZip(content: string): Promise<any[]> {
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

function mapJsonToSections(sectionJsonArray: any[]): Section[] {
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

function mapResultsToSectionArray(resultJsonArray: any[]): Section[] {
	const sectionArray: Section[] = [];

	for (const resultJson of resultJsonArray) {
		const { result } = resultJson;
		sectionArray.push(...mapJsonToSections(result));
	}

	return sectionArray;
}

export async function createSectionsDatasetFromContent(content: string, kind: InsightDatasetKind): Promise<Dataset> {
	const resultJsonArray: any[] = await extractCourseResultsFromZip(content);

	const sectionArray = mapResultsToSectionArray(resultJsonArray);

	const newDataset = new Dataset(sectionArray, kind);

	if (sectionArray.length === 0) {
		throw new InsightError("Invalid dataset, no sections");
	}

	return newDataset;
}

function findBuildingLinks(node: any): string[] {
	const links: string[] = [];

	// Helper function to check if node is a td with views-field class
	function isViewsFieldTd(node: any): boolean {
		return (
			node.nodeName === "td" &&
			node.attrs?.some((attr: any) => attr.name === "class" && attr.value.includes("views-field"))
		);
	}

	// Helper function to find href in anchor tags
	function findHrefInNode(node: any): string | null {
		if (node.nodeName === "a" && node.attrs) {
			const hrefAttr = node.attrs.find((attr: any) => attr.name === "href");
			return hrefAttr?.value || null;
		}
		return null;
	}

	// Recursive function to traverse the node tree
	function traverse(node: any) {
		if (!node) return;

		if (isViewsFieldTd(node)) {
			// If found a td with views-field class, look for anchor tags within it
			if (node.childNodes) {
				node.childNodes.forEach((child: any) => {
					const href = findHrefInNode(child);
					if (href && href.includes(".htm")) {
						links.push(href);
					}
					// Continue traversing in case there are nested elements
					traverse(child);
				});
			}
		} else if (node.childNodes) {
			// Continue traversing the tree
			node.childNodes.forEach((child: any) => traverse(child));
		}
	}

	traverse(node);
	return links;
}

function createAllRoomObjects(validTable: any): Room[] {
	// get all tr rows
	const allRows = findAllRows(validTable);
	const tempRooms: Room[] = [];

	// find room number

	for (const row of allRows) {
		const roomNumber = findRoomNumber(row);
		const roomCapacity = findRoomCapacity(row);
		const furniture = findFurniture(row);
		const roomType = findRoomType(row);
		const href = findMoreInfo(row);
		const newRoom = new Room("", "", roomNumber, "", "", 0, 0, roomCapacity, roomType, furniture, href);
		tempRooms.push(newRoom);
	}
	return tempRooms;
}

function findAllRows(table: any): any[] {
	function findTableBodyRows(table: any): any[] {
		const rows: any[] = [];

		function traverse(table: any) {
			if (!table) {
				return;
			}

			if (table.nodeName === "tbody") {
				if (table.childNodes) {
					table.childNodes.forEach((child: any) => {
						if (child.nodeName === "tr") {
							rows.push(child);
						}
					});
				}
				return;
			}
			if (table.childNodes) {
				table.childNodes.forEach((child: any) => {
					traverse(child);
				});
			}
		}
		traverse(table);
		return rows;
	}
	const allRows = findTableBodyRows(table);
	return allRows;
}

function hasClass(td: any, classToFind: string): boolean {
	// Fixed to properly check attrs array
	return td.attrs?.some((attr: any) => attr.name === "class" && attr.value.includes(classToFind));
}

function findRoomNumber(row: any): string {
	const classToFind = "views-field-field-room-number";
	let roomNumber = "";

	const cells = row.childNodes.filter((node: any) => node.nodeName === "td");

	cells.forEach((cell: any) => {
		if (hasClass(cell, classToFind)) {
			const anchor = cell.childNodes?.find((node: any) => node.nodeName === "a");
			if (anchor && anchor.childNodes) {
				const textNode = anchor.childNodes?.find((node: any) => node.nodeName === "#text");
				if (textNode) {
					roomNumber = textNode.value.trim();
				}
			}
		}
	});

	return roomNumber;
}

function findRoomCapacity(row: any): number {
	const classToFind = "views-field-field-room-capacity";
	let roomCapacity = 0;
	const cells = row.childNodes.filter((node: any) => node.nodeName === "td");

	cells.forEach((cell: any) => {
		if (hasClass(cell, classToFind)) {
			if (cell.childNodes) {
				const textNode = cell.childNodes?.find((node: any) => node.nodeName === "#text");
				if (textNode) {
					roomCapacity = parseInt(textNode.value.trim(), 10);
				}
			}
		}
	});
	return roomCapacity;
}

function findFurniture(row: any) {
	const classToFind = "views-field-field-room-furniture";
	let furniture = "";
	const cells = row.childNodes.filter((node: any) => node.nodeName === "td");

	cells.forEach((cell: any) => {
		if (hasClass(cell, classToFind)) {
			if (cell.childNodes) {
				const textNode = cell.childNodes?.find((node: any) => node.nodeName === "#text");
				if (textNode) {
					furniture = textNode.value.trim();
				}
			}
		}
	});
	return furniture;
}

function findRoomType(row: any) {
	const classToFind = "views-field-field-room-type";
	let roomType = "";
	const cells = row.childNodes.filter((node: any) => node.nodeName === "td");

	cells.forEach((cell: any) => {
		if (hasClass(cell, classToFind)) {
			if (cell.childNodes) {
				const textNode = cell.childNodes?.find((node: any) => node.nodeName === "#text");
				if (textNode) {
					roomType = textNode.value.trim();
				}
			}
		}
	});
	return roomType;
}

function findMoreInfo(row: any) {
	const classToFind = "views-field-nothing";
	let href = "";
	const cells = row.childNodes.filter((node: any) => node.nodeName === "td");

	cells.forEach((cell: any) => {
		if (hasClass(cell, classToFind)) {
			const anchor = cell.childNodes?.find((node: any) => node.nodeName === "a");
			if (anchor && anchor.attrs) {
				const hrefAttribute = anchor.attrs?.find((node: any) => node.name === "href");
				if (hrefAttribute) {
					href = hrefAttribute.value.trim();
				}
			}
		}
	});
	return href;
}

function findAllTables(parsedData: any): any {
	const allTables: any[] = [];
	traverse(parsedData);

	function traverse(node: any) {
		if (node.tagName === "table") {
			allTables.push(node);
		}
		if (node.childNodes) {
			node.childNodes.forEach((child: any) => traverse(child));
		}
	}
	//console.log(allTables[0]);
	return allTables;
}

function findValidTable(allTables: any): any {
	// Helper function to check if td has views-field-field-number class
	function hasNumberFieldClass(node: any): boolean {
		if (node.nodeName !== "td") return false;

		return node.attrs?.some(
			(attr: any) => attr.name === "class" && attr.value.includes("views-field-field-room-number")
		);
	}

	function searchTableForNumberFieldClass(node: any): boolean {
		let foundValidTd = false;

		function traverse(node: any) {
			if (!node) {
				return false;
			}
			if (hasNumberFieldClass(node)) {
				foundValidTd = true;
				return true;
			}

			if (node.childNodes) {
				node.childNodes.forEach((child: any) => {
					// kinda redundant but just checking to be safe
					if (!foundValidTd) {
						traverse(child);
					}
				});
			}
		}
		traverse(node);
		return foundValidTd;
	}
	for (const table of allTables) {
		if (searchTableForNumberFieldClass(table)) {
			return table;
		}
	}
}

async function createRoomsDataSetFromContent(content: string): Promise<Dataset> {
	const zip = new JSZip();
	let rooms: Room[] = [];
	const zipData = await zip.loadAsync(content, { base64: true });

	const campusFolderPath = "campus/";
	const hasCampusFolder = Object.keys(zipData.files).some((fileName) => fileName === campusFolderPath);
	if (!hasCampusFolder) {
		throw new InsightError("No folder 'campus' in zip file");
	}
	const indexFilePath = "index.htm";
	const hasIndexHTM = Object.keys(zipData.files).some((fileName) => fileName === indexFilePath);
	if (!hasIndexHTM) {
		throw new InsightError("No index.htm in zip file");
	}
	const fileData = await zipData.file("index.htm")?.async("string");
	const parsedFileData = parse5.parse(fileData);
	//console.log(parsedFileData);
	// Find all the building links
	const buildingLinks = findBuildingLinks(parsedFileData);

	// Process links
	for (const link of buildingLinks) {
		// Remove the './' from the beginning of the path if it exists
		const cleanPath = link.startsWith("./") ? link.slice(2) : link;

		// Get the building details file from the zip
		const roomFromBuildingFile = zipData.file(cleanPath);
		if (roomFromBuildingFile) {
			const unparsedRoomData = await roomFromBuildingFile.async("string");
			// Process room data
			const parsedRoomData = parse5.parse(unparsedRoomData);
			const findTables = findAllTables(parsedRoomData);
			const validTable = findValidTable(findTables);

			if (validTable) {
				const roomObjects = createAllRoomObjects(validTable);
				// Concatenate new rooms instead of overwriting
				rooms = rooms.concat(roomObjects);
				console.log(roomObjects);
			}
		}
	}
	return new Dataset(rooms, InsightDatasetKind.Rooms);
}

export async function createDatasetFromContent(content: string, kind: InsightDatasetKind): Promise<Dataset> {
	if (kind === InsightDatasetKind.Rooms) {
		return createRoomsDataSetFromContent(content);
	} else if (kind === InsightDatasetKind.Sections) {
		return createSectionsDatasetFromContent(content, kind);
	} else {
		throw new InsightError();
	}
}
