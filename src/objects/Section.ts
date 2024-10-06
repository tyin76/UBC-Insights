class Section {
	private uuid: string;
	private id: string;
	private title: string;
	private instructor: string;
	private dept: string;
	private year: number;
	private avg: number;
	private pass: number;
	private fail: number;
	private audit: number;
	private section: string; // We will not have a getter for this because I'm pretty sure in the specifications you can't query based on this parameter

	constructor(
		id: string,
		course: string,
		title: string,
		professor: string,
		subject: string,
		year: number,
		avg: number,
		pass: number,
		fail: number,
		audit: number,
		section: string
	) {
		this.uuid = id;
		this.id = course;
		this.title = title;
		this.instructor = professor;
		this.dept = subject;
		this.avg = avg;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;
		this.section = section;

		// As per the specifications, set year to 1900 if section is "overall"
		if (section === "overall") {
			this.year = 1900;
		} else {
			this.year = year;
		}
	}

	public getUuid(): string {
		return this.uuid;
	}

	public getId(): string {
		return this.id;
	}

	public getTitle(): string {
		return this.title;
	}

	public getInstructor(): string {
		return this.instructor;
	}

	public getDept(): string {
		return this.dept;
	}

	public getYear(): number {
		return this.year;
	}

	public getAvg(): number {
		return this.avg;
	}

	public getPass(): number {
		return this.pass;
	}

	public getFail(): number {
		return this.fail;
	}

	public getAudit(): number {
		return this.audit;
	}

	public toJSON(): object {
		return {
			uuid: this.uuid,
			id: this.id,
			title: this.title,
			instructor: this.instructor,
			dept: this.dept,
			year: this.year,
			avg: this.avg,
			pass: this.pass,
			fail: this.fail,
			audit: this.audit,
			section: this.section,
		};
	}
}

export default Section;
