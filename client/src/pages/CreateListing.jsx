import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ListingForm from "../components/ListingForm";
import { post } from "../lib/api";

function CreateListing() {
  const navigate = useNavigate();

  const submit = async (values) => {
    const listing = await post("/listing/create", values);
    toast.success("Your home is live");
    navigate(`/listing/${listing._id}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">List your home</h1>
      <ListingForm submitLabel="Publish listing" onSubmit={submit} />
    </div>
  );
}

export default CreateListing;
