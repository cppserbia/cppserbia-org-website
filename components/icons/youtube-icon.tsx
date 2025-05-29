import Image from "next/image";

interface YouTubeIconProps {
    width?: number;
    height?: number;
    className?: string;
    color?: "white" | "red" | "inherit";
}

export function YouTubeIcon({
    width = 16,
    height = 16,
    className = "",
    color = "inherit"
}: YouTubeIconProps) {
    const getColorFilter = () => {
        switch (color) {
            case "white":
                return "invert(1)"; // Makes black SVG white
            case "red":
                return "invert(12%) sepia(100%) saturate(6500%) hue-rotate(360deg) brightness(100%) contrast(100%)"; // Makes it YouTube red
            case "inherit":
            default:
                return undefined;
        }
    };

    return (
        <Image
            src="/icons/youtube.svg"
            alt="YouTube"
            width={width}
            height={height}
            className={className}
            style={{
                filter: getColorFilter(),
                display: "block"
            }}
        />
    );
}
