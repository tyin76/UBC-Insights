import { hasClass } from "./RoomHelpers";

export function findRoomNumber(row: any): string {
	const classToFind = "views-field-field-room-number";
	let roomNumber = "";

	const cells = row.childNodes.filter((node: any) => node.nodeName === "td");

	cells.forEach((cell: any) => {
		if (hasClass(cell, classToFind)) {
			const anchor = cell.childNodes?.find((node: any) => node.nodeName === "a");
			if (anchor?.childNodes) {
				const textNode = anchor.childNodes?.find((node: any) => node.nodeName === "#text");
				if (textNode) {
					roomNumber = textNode.value.trim();
				}
			}
		}
	});

	return roomNumber;
}

export function findRoomCapacity(row: any): number {
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

export function findFurniture(row: any): string {
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

export function findRoomType(row: any): string {
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

export function findMoreInfo(row: any): string {
	const classToFind = "views-field-nothing";
	let href = "";
	const cells = row.childNodes.filter((node: any) => node.nodeName === "td");

	cells.forEach((cell: any) => {
		if (hasClass(cell, classToFind)) {
			const anchor = cell.childNodes?.find((node: any) => node.nodeName === "a");
			if (anchor?.attrs) {
				const hrefAttribute = anchor.attrs?.find((node: any) => node.name === "href");
				if (hrefAttribute) {
					href = hrefAttribute.value.trim();
				}
			}
		}
	});
	return href;
}
