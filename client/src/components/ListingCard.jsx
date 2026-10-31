import { BedDouble, MapPin, Maximize2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice, OCCUPANCY_LABELS } from "../lib/format";
import CompareButton from "./CompareButton";
import Photo from "./Photo";
import SaveButton from "./SaveButton";

function ListingCard({ listing }) {
  return (
    <article className="group relative">
      <Link to={`/listing/${listing._id}`} className="block">
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
          <Photo
            src={listing.imageUrls[0]}
            alt={listing.name}
            className="h-full w-full transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex gap-1.5">
            {listing.offer && (
              <span className="text-xs font-semibold bg-orange-600 text-white rounded-full px-2.5 py-1">
                Offer
              </span>
            )}
            {listing.bachelorFriendly && (
              <span className="text-xs font-semibold bg-white/95 text-slate-800 rounded-full px-2.5 py-1">
                Bachelors OK
              </span>
            )}
          </div>
        </div>
        <div className="pt-3">
          <p className="text-lg font-bold">
            {formatPrice(listing.effectivePrice ?? listing.regularPrice)}
            <span className="text-sm font-normal text-muted"> /month</span>
            {listing.offer && (
              <span className="ml-2 text-sm font-normal text-muted line-through">
                {formatPrice(listing.regularPrice)}
              </span>
            )}
          </p>
          <h3 className="font-medium truncate">{listing.name}</h3>
          <p className="text-sm text-muted flex items-center gap-1 truncate">
            <MapPin size={14} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{listing.address}</span>
          </p>
          <p className="text-sm text-muted flex items-center gap-3 mt-1">
            {listing.occupancy && listing.occupancy !== "full" ? (
              <span className="flex items-center gap-1">
                <Users size={15} aria-hidden="true" /> {OCCUPANCY_LABELS[listing.occupancy]}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <BedDouble size={15} aria-hidden="true" /> {listing.bedrooms} BHK
              </span>
            )}
            {listing.carpetArea > 0 && (
              <span className="flex items-center gap-1">
                <Maximize2 size={13} aria-hidden="true" /> {listing.carpetArea} sq ft
              </span>
            )}
          </p>
        </div>
      </Link>
      <SaveButton id={listing._id} name={listing.name} className="absolute top-3 right-3" />
      <CompareButton listing={listing} className="absolute top-[3.75rem] right-3" />
    </article>
  );
}

export function CardSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="rounded-2xl bg-raised aspect-[4/3]" />
      <div className="h-5 bg-raised rounded mt-3 w-1/2" />
      <div className="h-4 bg-raised rounded mt-2 w-3/4" />
    </div>
  );
}

export function ListingGrid({ listings, loading, skeletons = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
      {loading
        ? Array.from({ length: skeletons }, (_, index) => (
            <CardSkeleton key={index} />
          ))
        : listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
    </div>
  );
}

export default ListingCard;
