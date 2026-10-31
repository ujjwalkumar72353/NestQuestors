import { ImagePlus, Trash2 } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { OCCUPANCY_LABELS } from "../lib/format";

const LocationPicker = lazy(() => import("./LocationPicker"));

const MAX_PHOTOS = 6;

const EMPTY = {
  name: "",
  description: "",
  address: "",
  city: "",
  bedrooms: 1,
  bathrooms: 1,
  regularPrice: "",
  discountPrice: "",
  occupancy: "full",
  carpetArea: "",
  floor: 1,
  totalFloors: 4,
  balconies: 1,
  facing: "",
  propertyAge: 0,
  deposit: "",
  maintenance: "",
  availableFrom: "",
  leaseMonths: 11,
  foodPreference: "any",
  petsAllowed: false,
  gatedSociety: false,
  brokerageFree: true,
  lat: null,
  lng: null,
  furnished: false,
  parking: false,
  bachelorFriendly: true,
  offer: false,
  amenities: [],
  imageUrls: [],
};

const Check = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      className="h-4 w-4 accent-[var(--brand)]"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    {label}
  </label>
);

function ListingForm({ initial, submitLabel, onSubmit }) {
  const [form, setForm] = useState(() => {
    const [lng = null, lat = null] = initial?.location?.coordinates || [];
    return {
      ...EMPTY,
      ...initial,
      lat,
      lng,
      availableFrom: initial?.availableFrom?.slice(0, 10) || "",
    };
  });
  const [options, setOptions] = useState({ cities: [], amenities: [], facings: [] });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/listing/options").then(setOptions).catch(() => {});
  }, []);

  const set = (key) => (value) => setForm((old) => ({ ...old, [key]: value }));
  const onInput = (key) => (event) => set(key)(event.target.value);

  const addPhotos = async (event) => {
    const files = [...event.target.files].slice(
      0,
      MAX_PHOTOS - form.imageUrls.length
    );
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const body = new FormData();
        body.append("image", file);
        const { url } = await api("/listing/upload", { method: "POST", body });
        urls.push(url);
      }
      setForm((old) => ({ ...old, imageUrls: [...old.imageUrls, ...urls] }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleAmenity = (name) =>
    set("amenities")(
      form.amenities.includes(name)
        ? form.amenities.filter((item) => item !== name)
        : [...form.amenities, name]
    );

  const submit = async (event) => {
    event.preventDefault();
    if (!form.imageUrls.length) {
      toast.error("Add at least one photo");
      return;
    }
    if (form.lat === null) {
      toast.error("Pin the home on the map");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        name: form.name,
        description: form.description,
        address: form.address,
        city: form.city,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        regularPrice: Number(form.regularPrice),
        discountPrice: form.offer ? Number(form.discountPrice) : 0,
        furnished: form.furnished,
        parking: form.parking,
        bachelorFriendly: form.bachelorFriendly,
        offer: form.offer,
        amenities: form.amenities,
        imageUrls: form.imageUrls,
        occupancy: form.occupancy,
        carpetArea: Number(form.carpetArea),
        floor: Number(form.floor),
        totalFloors: Number(form.totalFloors),
        balconies: Number(form.balconies),
        facing: form.facing,
        propertyAge: Number(form.propertyAge),
        deposit: Number(form.deposit),
        maintenance: Number(form.maintenance),
        availableFrom: form.availableFrom
          ? new Date(form.availableFrom).toISOString()
          : undefined,
        leaseMonths: Number(form.leaseMonths),
        foodPreference: form.foodPreference,
        petsAllowed: form.petsAllowed,
        gatedSociety: form.gatedSociety,
        brokerageFree: form.brokerageFree,
        lat: form.lat,
        lng: form.lng,
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid lg:grid-cols-2 gap-6">
      <div className="card p-5 flex flex-col gap-4">
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input className="input mt-1" required minLength={5} maxLength={80} value={form.name} onChange={onInput("name")} placeholder="Sunny 2BHK near Hitech City" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea className="input mt-1 h-28 py-2" required minLength={20} maxLength={2000} value={form.description} onChange={onInput("description")} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Address</span>
          <input className="input mt-1" required minLength={5} value={form.address} onChange={onInput("address")} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">City</span>
            <select className="input mt-1" required value={form.city} onChange={onInput("city")}>
              <option value="">Choose city</option>
              {options.cities.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Rental type</span>
            <select className="input mt-1" value={form.occupancy} onChange={onInput("occupancy")}>
              {Object.entries(OCCUPANCY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Bedrooms</span>
            <input className="input mt-1" type="number" min={1} max={10} required value={form.bedrooms} onChange={onInput("bedrooms")} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Bathrooms</span>
            <input className="input mt-1" type="number" min={1} max={10} required value={form.bathrooms} onChange={onInput("bathrooms")} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Rent (₹ per month)</span>
            <input className="input mt-1" type="number" min={1} required value={form.regularPrice} onChange={onInput("regularPrice")} />
          </label>
          {form.offer && (
            <label className="block">
              <span className="text-sm font-medium">Offer rent (₹ per month)</span>
              <input className="input mt-1" type="number" min={1} required value={form.discountPrice} onChange={onInput("discountPrice")} />
            </label>
          )}
          <label className="block">
            <span className="text-sm font-medium">Security deposit (₹)</span>
            <input className="input mt-1" type="number" min={0} required value={form.deposit} onChange={onInput("deposit")} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Maintenance (₹ per month)</span>
            <input className="input mt-1" type="number" min={0} required value={form.maintenance} onChange={onInput("maintenance")} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Carpet area (sq ft)</span>
            <input className="input mt-1" type="number" min={50} required value={form.carpetArea} onChange={onInput("carpetArea")} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Facing</span>
            <select className="input mt-1" value={form.facing} onChange={onInput("facing")}>
              <option value="">Not specified</option>
              {options.facings.map((facing) => <option key={facing}>{facing}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Floor</span>
            <input className="input mt-1" type="number" min={0} value={form.floor} onChange={onInput("floor")} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Total floors</span>
            <input className="input mt-1" type="number" min={0} value={form.totalFloors} onChange={onInput("totalFloors")} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Balconies</span>
            <input className="input mt-1" type="number" min={0} max={6} value={form.balconies} onChange={onInput("balconies")} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Property age (years)</span>
            <input className="input mt-1" type="number" min={0} value={form.propertyAge} onChange={onInput("propertyAge")} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Available from</span>
            <input className="input mt-1" type="date" value={form.availableFrom} onChange={onInput("availableFrom")} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Minimum lease (months)</span>
            <input className="input mt-1" type="number" min={1} max={120} value={form.leaseMonths} onChange={onInput("leaseMonths")} />
          </label>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Pin the exact location</p>
          <Suspense fallback={<div className="h-72 rounded-xl bg-raised" />}>
            <LocationPicker
              city={form.city}
              lat={form.lat}
              lng={form.lng}
              onChange={(lat, lng) => setForm((old) => ({ ...old, lat, lng }))}
            />
          </Suspense>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="card p-5">
          <p className="text-sm font-medium mb-3">Details</p>
          <div className="grid grid-cols-2 gap-3">
            <Check label="Furnished" checked={form.furnished} onChange={set("furnished")} />
            <Check label="Parking" checked={form.parking} onChange={set("parking")} />
            <Check label="Bachelor friendly" checked={form.bachelorFriendly} onChange={set("bachelorFriendly")} />
            <Check label="On offer" checked={form.offer} onChange={set("offer")} />
            <Check label="Gated society" checked={form.gatedSociety} onChange={set("gatedSociety")} />
            <Check label="Pets allowed" checked={form.petsAllowed} onChange={set("petsAllowed")} />
            <Check label="No brokerage" checked={form.brokerageFree} onChange={set("brokerageFree")} />
            <Check label="Vegetarian only" checked={form.foodPreference === "veg"} onChange={(value) => set("foodPreference")(value ? "veg" : "any")} />
          </div>
          <p className="text-sm font-medium mt-5 mb-3">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {options.amenities.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={form.amenities.includes(name)}
                onClick={() => toggleAmenity(name)}
                className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors ${
                  form.amenities.includes(name)
                    ? "bg-brand-soft border-brand text-brand"
                    : "border-line hover:bg-raised"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm font-medium mb-1">Photos</p>
          <p className="text-sm text-muted mb-3">
            Up to {MAX_PHOTOS} PNG, JPG or WEBP images, 5 MB each.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {form.imageUrls.map((url) => (
              <div key={url} className="relative aspect-square">
                <img src={url} alt="Listing" className="h-full w-full object-cover rounded-xl" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => set("imageUrls")(form.imageUrls.filter((item) => item !== url))}
                  className="absolute top-1 right-1 h-8 w-8 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
            {form.imageUrls.length < MAX_PHOTOS && (
              <label className="aspect-square rounded-xl border border-dashed border-line flex flex-col items-center justify-center gap-1 text-sm text-muted cursor-pointer hover:bg-raised transition-colors">
                <ImagePlus size={20} aria-hidden="true" />
                {uploading ? "Uploading" : "Add photos"}
                <input
                  type="file"
                  aria-label="Add photos"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  disabled={uploading}
                  onChange={addPhotos}
                  className="sr-only"
                />
              </label>
            )}
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving || uploading}>
          {saving ? "Saving" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default ListingForm;
