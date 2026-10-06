import React from "react";

import leblancLocation from "./assets/location-leblanc.png";

type SpaceId = "leblanc" | "ryuji";

type LocationWidgetProps = {
  spaceId: SpaceId;
  className?: string;
};

type Location = {
  name: string;
  image?: string;
};

// Record<SpaceId, ...> forces us to list EVERY space; TS errors if one is missing.
const LOCATIONS: Record<SpaceId, Location> = {
  leblanc: { name: "Café Leblanc", image: leblancLocation },
  ryuji: { name: "Ryuji's Place" }, // no artwork yet, falls back to text
};

export const LocationWidget = ({
  spaceId,
  className = "",
}: LocationWidgetProps): React.JSX.Element => {
  const location = LOCATIONS[spaceId];

  return (
    <div
      className={`flex items-center justify-center bg-white ${className}`}
      aria-label={`Current location: ${location.name}`}
    >
      {location.image ? (
        <img
          className="h-full w-full object-contain"
          src={location.image}
          alt={location.name}
        />
      ) : (
        <span className="font-body-primary text-black">{location.name}</span>
      )}
    </div>
  );
};

export default LocationWidget;
