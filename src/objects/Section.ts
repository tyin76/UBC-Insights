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
		audit: number
	) {
		this.uuid = id;
		this.id = course;
		this.title = title;
		this.instructor = professor;
		this.dept = subject;
		this.year = year;
		this.avg = avg;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;
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

	public toJSON() {
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
		};
	}
}

export default Section;
