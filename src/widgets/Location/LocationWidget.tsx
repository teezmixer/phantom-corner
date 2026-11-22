import { MapPin } from "@phosphor-icons/react";
import { getLocation } from "@/content/registry";

type LocationWidgetProps = {
  locationId: string;
  className?: string;
};

/**
 * The location sign. Until Ares's drawn signs return (D-21), it is a Phosphor map pin plus the place name in the
 * display face — the spec's own fallback for a location without sign art (§3.6).
 */
export const LocationWidget = ({ locationId, className = "" }: LocationWidgetProps): React.JSX.Element => {
  const location = getLocation(locationId);
  return (
    <div className={`pointer-events-auto flex items-center justify-end gap-3 text-white ${className}`} aria-label={`Current location: ${location.name}`}>
      <MapPin size={48} weight="fill" className="shrink-0 text-redbright" aria-hidden="true" />
      <span className="border-2 border-white bg-black px-4 py-2 font-display-title text-5xl leading-none [text-shadow:none]">{location.name}</span>
    </div>
  );
};

export default LocationWidget;
