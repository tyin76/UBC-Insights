import Button from "@mui/material/Button";

function CustomButton({ text, width, height }: { text: string; width: string; height?: string }) {
	return (
		<div>
			<Button
				sx={{
					width: width,
					height: height ?? width, // Default to width if height is not provided
				}}
			>
				{text}
			</Button>
		</div>
	);
}

export default CustomButton;
