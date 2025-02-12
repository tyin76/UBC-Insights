import JSZip from "jszip";
import { InsightDatasetKind, InsightError } from "../controller/IInsightFacade";
import Dataset from "../objects/Dataset";
import Room from "../objects/Room";
import { geoLocationRequest } from "./GeoHelper";
import { findFurniture } from "./FindRoomAttributeHelpers";
import { findRoomCapacity } from "./FindRoomAttributeHelpers";
import { findMoreInfo } from "./FindRoomAttributeHelpers";
import { findRoomNumber } from "./FindRoomAttributeHelpers";
import { findRoomType } from "./FindRoomAttributeHelpers";
import { findBuildingLinks } from "./RoomBuildingLinkExtractor";

const parse5 = require("parse5");

function extractRoomNumber(url: string): any {
	const regex = /room\/([A-Z0-9-]+)/; // Regular expression to match the room number
	const match = url.match(regex);
	return match ? match[1].replace(/-/g, "_") : null; // Replace hyphen with underscore
}

function extractShortName(href: string): string {
	let result = "";
	const match = href.match(/room\/([A-Z]+)-\w+/);
	if (match) {
		result = match[1];
	}

	return result;
}
async function createAllRoomObjects(validTable: any, roomAndAddress: any): Promise<Room[]> {
	// get all tr rows
	const allRows = findAllRows(validTable);
	const tempRooms: Room[] = [];
	const address = roomAndAddress.address;
	const fullName = roomAndAddress.name;

	const { lat, lon } = await geoLocationRequest(address);
	//console.log(lat);
	//console.log(lon);

	for (const row of allRows) {
		const roomNumber = findRoomNumber(row);
		const roomCapacity = findRoomCapacity(row);
		const furniture = findFurniture(row);
		const roomType = findRoomType(row);
		const href = findMoreInfo(row);
		const roomIdName = extractRoomNumber(href);
		const shortName = extractShortName(href);
		const newRoom = new Room(
			fullName,
			shortName,
			roomNumber,
			roomIdName,
			address,
			lat,
			lon,
			roomCapacity,
			roomType,
			furniture,
			href
		);
		tempRooms.push(newRoom);
	}

	return tempRooms;
}

function findAllRows(topTable: any): any[] {
	function findTableBodyRows(secondTopTable: any): any[] {
		const rows: any[] = [];

		function traverse(table: any): any {
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
		traverse(secondTopTable);
		return rows;
	}
	const allRows = findTableBodyRows(topTable);
	return allRows;
}

export function hasClass(td: any, classToFind: string): boolean {
	// Fixed to properly check attrs array
	return td.attrs?.some((attr: any) => attr.name === "class" && attr.value.includes(classToFind));
}

function findNameAndAddressDiv(parsedRoomData: any): any {
	if (!parsedRoomData) {
		return null;
	}

	// find div with id = building-info
	if (parsedRoomData.nodeName === "div" && parsedRoomData.attrs) {
		const doesDivExist = parsedRoomData.attrs.find((node: any) => node.name === "id" && node.value === "building-info");
		if (doesDivExist) {
			return parsedRoomData;
		}
	}

	// continue traversing
	if (parsedRoomData.childNodes) {
		for (const child of parsedRoomData.childNodes) {
			const result = findNameAndAddressDiv(child);
			if (result) {
				return result;
			}
		}
	}
	return null;
}

function findBuildingFullName(buildingInfoDiv: any): string {
	let buildingName = "";
	const h2Node = buildingInfoDiv.childNodes.find((child: any) => child.nodeName === "h2");
	if (h2Node) {
		const span = h2Node.childNodes.find((spanNode: any) => spanNode.nodeName === "span");
		if (span?.childNodes) {
			const textNode = span.childNodes.find((text: any) => text.nodeName === "#text");
			if (textNode) {
				buildingName = textNode.value.trim(); // Extract the building name
			}
		}
	}
	return buildingName;
}

function extractBuildingInfo(node: any): any {
	const buildingInfoDiv = findNameAndAddressDiv(node);
	if (!buildingInfoDiv) {
		return null; // If the div is not found, return null
	}

	const buildingName = findBuildingFullName(buildingInfoDiv);
	let buildingAddress = "";

	// Extract building address from the first "building-field" div
	const buildingFieldDivs = buildingInfoDiv.childNodes.filter(
		(child: any) =>
			child.nodeName === "div" &&
			child.attrs?.some((attr: any) => attr.name === "class" && attr.value === "building-field")
	);

	if (buildingFieldDivs.length > 0) {
		const firstFieldContentDiv = buildingFieldDivs[0].childNodes.find(
			(fieldChild: any) =>
				fieldChild.nodeName === "div" &&
				fieldChild.attrs?.some((attr: any) => attr.name === "class" && attr.value === "field-content")
		);

		if (firstFieldContentDiv?.childNodes) {
			const textNode = firstFieldContentDiv.childNodes.find((text: any) => text.nodeName === "#text");
			if (textNode) {
				buildingAddress = textNode.value.trim(); // Extract the building address
			}
		}
	}
	//console.log("name: " + buildingName);
	//console.log("address: " + buildingAddress);
	return { name: buildingName, address: buildingAddress }; // Return the extracted details
}

function findAllTables(parsedData: any): any {
	const allTables: any[] = [];
	traverse(parsedData);

	function traverse(node: any): any {
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
		if (node.nodeName !== "td") {
			return false;
		}

		return node.attrs?.some(
			(attr: any) => attr.name === "class" && attr.value.includes("views-field-field-room-number")
		);
	}

	function searchTableForNumberFieldClass(table: any): boolean {
		let foundValidTd = false;

		function traverse(node: any): any {
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
					traverse(child);
				});
			}
		}
		traverse(table);
		return foundValidTd;
	}
	for (const table of allTables) {
		if (searchTableForNumberFieldClass(table)) {
			return table;
		}
	}
}

function checkforIndexHTMAndCampusFolder(zipData: any): void {
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
}

export async function createRoomsDataSetFromContent(content: string): Promise<Dataset> {
	const zip = new JSZip();
	let rooms: Room[] = [];

	const zipData = await zip.loadAsync(content, { base64: true });

	checkforIndexHTMAndCampusFolder(zipData);

	const fileData = await zipData.file("index.htm")?.async("string");
	const parsedFileData = parse5.parse(fileData);
	//console.log(parsedFileData);
	// Find all the building links
	const buildingLinks = findBuildingLinks(parsedFileData);
	//console.log(buildingLinks);

	// Gather promises for each building link instead of awaiting inside the loop
	const roomPromises = buildingLinks.map(async (link) => {
		// Remove the './' from the beginning of the path if it exists
		const sliceBy = 2;
		const cleanPath = link.startsWith("./") ? link.slice(sliceBy) : link;

		// Get the building details file from the zip
		const roomFromBuildingFile = zipData.file(cleanPath);
		if (roomFromBuildingFile) {
			const unparsedRoomData = await roomFromBuildingFile.async("string");
			// Process room data
			const parsedRoomData = parse5.parse(unparsedRoomData);
			const findTables = findAllTables(parsedRoomData);
			const validTable = findValidTable(findTables);

			if (validTable) {
				const fullNameAndAddress = extractBuildingInfo(parsedRoomData);
				return await createAllRoomObjects(validTable, fullNameAndAddress);
			}
		}
		return []; // Return an empty array if no valid table found or file not found
	});

	// Resolve all promises concurrently
	const roomResults = await Promise.all(roomPromises);

	// Flatten the results from each promise and concatenate to tempRooms
	rooms = roomResults.flat();
	//console.log(tempRooms);

	//rooms = checkDuplicates(tempRooms);
	//console.log(rooms);
	// const dataset = new Dataset(rooms, InsightDatasetKind.Rooms);
	// const stringified = JSON.stringify(dataset);
	//console.log(stringified);

	// TODO: change back to rooms
	return new Dataset(rooms, InsightDatasetKind.Rooms);
}
